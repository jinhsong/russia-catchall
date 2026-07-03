// 전체 사용자 플로우 자동 점검 (조회 → 판정신청 → 허가예외 → 사전신고 → 의심징후 → 결과요약)
// 실행: npm install && npx playwright install chromium && npm test
// 눈으로 보면서 실행: npm run test:headed
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const MIME = { '.html': 'text/html; charset=utf-8', '.csv': 'text/csv; charset=utf-8', '.js': 'text/javascript', '.xlsx': 'application/octet-stream' };
const server = http.createServer(async (req, res) => {
  try {
    const path = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^([/\\])+/, '');
    const file = join(root, path === '' ? 'index.html' : path);
    if (!file.startsWith(root)) throw new Error('forbidden');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const errors = [];
const launchOpts = { headless: !process.env.HEADED };
if (process.env.CHROMIUM_PATH) launchOpts.executablePath = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(launchOpts);
const page = await browser.newPage();
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/net::|Failed to load resource/.test(m.text())) errors.push('CONSOLE: ' + m.text()); });
page.on('dialog', async d => { console.log('DIALOG:', d.type(), d.message().slice(0, 120)); await d.accept(); });

const step = async (name, fn) => {
  try { await fn(); console.log('OK  ', name); }
  catch (e) { console.log('FAIL', name, '-', e.message.split('\n')[0]); errors.push(name + ': ' + e.message.split('\n')[0]); }
};

await page.goto(BASE + '/index.html?dev=1', { waitUntil: 'networkidle' });

await step('DB loaded from CSV (incl. HSK master)', async () => {
  await page.waitForFunction(() => DB.self.length > 0 && DB.sanctions.length > 0 && DB.hskMaster.length > 0, null, { timeout: 5000 });
});

await step('HSK master feeds allowed HS list', async () => {
  const ok = await page.evaluate(() => isAllowedHS('8518300000') && isAllowedHS('8471.30-0000'));
  if (!ok) throw new Error('HSK master codes not in allowed list');
});

// 시나리오: 유효 비해당(SM-S928N) / 유효 해당(SM-F946N) / 판정정보 없음(NEW-MODEL-1)
await step('dev fill on input card + lookup', async () => {
  await page.click('body > button.btn.primary'); // 샘플 입력
  const v = await page.inputValue('#models');
  if (!v.includes('SM-S928N')) throw new Error('dev fill did not fill models: ' + v);
  await page.click('#btn-lookup');
  await page.waitForSelector('#card-results:not(.hide)');
});

await step('queues routed correctly', async () => {
  const r = await page.evaluate(() => ({
    classify: classifyTargets().map(x => x.model),
    exception: exceptionTargets().map(x => x.model),
    redflag: redflagTargets().map(x => x.model),
  }));
  if (JSON.stringify(r.classify) !== '["NEW-MODEL-1"]') throw new Error('classify=' + JSON.stringify(r.classify));
  if (JSON.stringify(r.exception) !== '["SM-F946N"]') throw new Error('exception=' + JSON.stringify(r.exception));
  if (JSON.stringify(r.redflag) !== '["SM-S928N"]') throw new Error('redflag=' + JSON.stringify(r.redflag));
});

await step('open classify', async () => {
  await page.click('#go-classify');
  await page.waitForSelector('#card-classify:not(.hide)');
});

await step('belarus without enduser blocked', async () => {
  await page.click('.ctry[value="벨라루스"]');
  await page.fill('#cl-item-0', '스마트폰');
  await page.fill('#cl-hs-0', '8517130000');
  await page.fill('#cl-spec-0', '화면 6.1형');
  await page.fill('#cl-weight-0', '230');
  await page.selectOption('#cl-purpose-select-0', { index: 1 });
  await page.click('#btn-classify-gen');
  const errShown = await page.locator('#imp-etc.err').count();
  const docCreated = await page.evaluate(() => !!state.classifyDoc);
  if (!errShown) throw new Error('no inline error on imp-etc');
  if (docCreated) throw new Error('classifyDoc created despite validation error');
});

await step('russia SERC generates doc (via dev fill)', async () => {
  await page.click('.ctry[value="벨라루스"]'); // 해제
  await page.click('body > button.btn.primary'); // 샘플 입력: 러시아+SERC 체크
  await page.click('#btn-classify-gen');
  await page.waitForSelector('#form-title');
  const t = await page.inputValue('#form-title');
  if (!t.includes('NEW-MODEL-1')) throw new Error('title=' + t);
});

await step('russia+SERC-only skips suspicion', async () => {
  if (!await page.locator('#cl-exception').count()) throw new Error('exception button missing');
  if (await page.locator('#cl-screen').count()) throw new Error('screen button should be hidden for russia+SERC only');
});

await step('exception: pick consumer → prenotif', async () => {
  await page.click('#cl-exception');
  await page.waitForSelector('#card-exception:not(.hide)');
  await page.click('#ex-options .radio[data-id="consumer"]');
  await page.click('#ex-continue');
  await page.waitForSelector('#card-prenotif:not(.hide)');
});

await step('prenotif: fixed candidate + dev fill + save', async () => {
  const invHtml = await page.innerHTML('#pn-invoices');
  if (!invHtml.includes('2단계 판정결과 기준')) throw new Error('fixed candidate missing');
  await page.click('body > button.btn.primary'); // 샘플 입력
  const buyer = await page.inputValue('#pn-buyer-0');
  if (buyer !== 'SERC') throw new Error('autofill buyer=' + buyer);
  await page.click('#btn-prenotif-save');
  await page.waitForSelector('#card-summary:not(.hide)');
});

await step('suspicion flow: 14 cards, all answers required', async () => {
  await page.click('#stepper button[data-card="#card-results"]');
  await page.click('#go-screen');
  await page.waitForSelector('#card-screen:not(.hide)');
  const cards = await page.locator('#indicators-body .mcard').count();
  if (cards !== 14) throw new Error('indicator cards=' + cards);
  await page.click('input[name="ind-0"][value="yes"]');
  await page.click('#btn-screen-next'); // 미답변 → alert 후 잔류
  const onScreen = await page.evaluate(() => !document.querySelector('#card-screen').classList.contains('hide'));
  if (!onScreen) throw new Error('advanced without all answers');
});

await step('dev fill answers rest → summary with warning', async () => {
  await page.click('body > button.btn.primary'); // 나머지 아니오 채움
  await page.click('#btn-screen-next');
  await page.waitForSelector('#card-summary:not(.hide)');
  const body = await page.textContent('#summary-body');
  if (!body.includes('의심징후 해당 항목이 있습니다')) throw new Error('missing flagged warning');
});

await step('report HTML well-formed', async () => {
  const html = await page.evaluate(() => reportHTML());
  if (!html.includes('5. 의심징후 점검')) throw new Error('missing section 5');
  if (html.includes('최종사용자 정보') || html.includes('<th>사업 분야</th>')) throw new Error('stale enduser section');
  if (!html.includes('INV-TEST-1')) throw new Error('missing invoice');
  if (!html.includes('[해당] 1.')) throw new Error('missing flagged indicator');
});

await step('exception none → final notice', async () => {
  await page.click('#stepper button[data-card="#card-exception"]');
  await page.click('#ex-options .radio[data-id="none"]');
  await page.click('#ex-continue');
  const res = await page.textContent('#ex-result');
  if (!res.includes('상황허가 대상입니다')) throw new Error('none notice missing: ' + res);
  if (!(await page.textContent('#ex-summary')).includes('결과 요약으로 이동')) throw new Error('summary btn not final');
});

await step('manual CSV load works', async () => {
  await page.setInputFiles('input[data-load="sanctions"]', { name: 'x.csv', mimeType: 'text/csv', buffer: Buffer.from('HS코드,품목설명\n9999,테스트품목\n') });
  await page.waitForFunction(() => DB.sanctions.length === 1 && DB.sanctions[0]['HS코드'] === '9999');
});

await step('manual HSK master load updates allowed HS', async () => {
  await page.setInputFiles('input[data-load="hskMaster"]', { name: 'hsk.csv', mimeType: 'text/csv', buffer: Buffer.from('HS부호,한글품목명\n1234567890,테스트HSK\n') });
  await page.waitForFunction(() => isAllowedHS('1234567890'));
});

await step('re-lookup keeps classify inputs', async () => {
  const kept = await page.evaluate(() => {
    document.querySelector('#models').value = 'NEW-MODEL-1\nSM-S928N';
    document.querySelector('#btn-lookup').click();
    return state.classify['NEW-MODEL-1'] && state.classify['NEW-MODEL-1'].item;
  });
  if (kept !== '스마트폰') throw new Error('classify input lost: ' + kept);
});

console.log(errors.length ? '\nERRORS:\n' + errors.join('\n') : '\nALL PASS');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
