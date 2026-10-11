const { DatabaseSync } = require('node:sqlite');
const { randomUUID, createHash } = require('node:crypto');
const { mkdirSync } = require('node:fs');
const { dirname } = require('node:path');
class InventoryError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
const date = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const offset = n => { const d = new Date(); d.setDate(d.getDate() + n); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const text = (value, name, max = 120, optional = false) => { if (typeof value !== 'string' || (!optional && !value.trim()) || value.trim().length > max) throw new InventoryError(`${name}格式不正确`); return value.trim(); };
const integer = (value, name, min = 0, max = 1000000) => { if (!Number.isSafeInteger(value) || value < min || value > max) throw new InventoryError(`${name}必须是 ${min}–${max} 范围的整数`); return value; };
const validDate = (value, name) => { if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new InventoryError(`${name}日期无效`); return value; };
function openInventory(filename, seed = true) {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS medicines(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, spec TEXT NOT NULL, category TEXT NOT NULL, unit TEXT NOT NULL, minStock INTEGER NOT NULL CHECK(minStock>=0), priceCents INTEGER NOT NULL CHECK(priceCents>=0), location TEXT NOT NULL, UNIQUE(name,spec));
    CREATE TABLE IF NOT EXISTS suppliers(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL, contact TEXT NOT NULL, phone TEXT NOT NULL, city TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS batches(id INTEGER PRIMARY KEY AUTOINCREMENT, medicineId INTEGER NOT NULL REFERENCES medicines(id), batchNo TEXT NOT NULL, expiryDate TEXT NOT NULL, supplierId INTEGER NOT NULL REFERENCES suppliers(id), quantity INTEGER NOT NULL CHECK(quantity>=0), UNIQUE(medicineId,batchNo));
    CREATE TABLE IF NOT EXISTS documents(id TEXT PRIMARY KEY, type TEXT NOT NULL CHECK(type IN ('inbound','outbound')), medicineId INTEGER NOT NULL REFERENCES medicines(id), quantity INTEGER NOT NULL CHECK(quantity>0), priceCents INTEGER NOT NULL CHECK(priceCents>=0), date TEXT NOT NULL, createdAt TEXT NOT NULL, party TEXT NOT NULL, note TEXT NOT NULL, idempotencyKey TEXT UNIQUE NOT NULL, fingerprint TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS document_lines(id INTEGER PRIMARY KEY AUTOINCREMENT, documentId TEXT NOT NULL REFERENCES documents(id), batchId INTEGER NOT NULL REFERENCES batches(id), quantity INTEGER NOT NULL CHECK(quantity>0));`);
  function transaction(fn) { db.exec('BEGIN IMMEDIATE'); try { const result = fn(); db.exec('COMMIT'); return result; } catch (e) { db.exec('ROLLBACK'); throw e; } }
  function medicine(input) { return { name: text(input.name, '药品名称', 60), spec: text(input.spec, '规格', 60), category: text(input.category, '分类', 30), unit: text(input.unit, '单位', 12), minStock: integer(input.minStock, '预警线'), priceCents: integer(input.priceCents, '价格分'), location: text(input.location, '库位', 30) }; }
  function supplier(input) { return { name: text(input.name, '供应商名称', 80), contact: text(input.contact, '联系人', 30, true), phone: text(input.phone, '电话', 30, true), city: text(input.city, '所在城市', 30, true) }; }
  function saveMedicine(input, id) {
    const m = medicine(input);
    if (id) { if (!db.prepare('SELECT id FROM medicines WHERE id=?').get(id)) throw new InventoryError('药品不存在', 404); db.prepare('UPDATE medicines SET name=?,spec=?,category=?,unit=?,minStock=?,priceCents=?,location=? WHERE id=?').run(...Object.values(m), id); }
    else id = Number(db.prepare('INSERT INTO medicines(name,spec,category,unit,minStock,priceCents,location) VALUES(?,?,?,?,?,?,?)').run(...Object.values(m)).lastInsertRowid);
    return { ...m, id };
  }
  function saveSupplier(input, id) {
    const s = supplier(input);
    if (id) { if (!db.prepare('SELECT id FROM suppliers WHERE id=?').get(id)) throw new InventoryError('供应商不存在', 404); db.prepare('UPDATE suppliers SET name=?,contact=?,phone=?,city=? WHERE id=?').run(...Object.values(s), id); }
    else id = Number(db.prepare('INSERT INTO suppliers(name,contact,phone,city) VALUES(?,?,?,?)').run(...Object.values(s)).lastInsertRowid);
    return { ...s, id };
  }
  function remove(kind, id) {
    if (!['medicines', 'suppliers'].includes(kind)) throw new InventoryError('类型无效');
    const field = kind === 'medicines' ? 'medicineId' : 'supplierId';
    if (db.prepare(`SELECT id FROM batches WHERE ${field}=? LIMIT 1`).get(id) || (kind === 'medicines' && db.prepare('SELECT id FROM documents WHERE medicineId=? LIMIT 1').get(id))) throw new InventoryError('已有关联库存或单据，不能删除；可保留档案供追溯');
    if (!db.prepare(`DELETE FROM ${kind} WHERE id=?`).run(id).changes) throw new InventoryError('记录不存在', 404);
    return { ok: true };
  }
  function submit(type, input, internal = false) {
    if (!['inbound', 'outbound'].includes(type)) throw new InventoryError('单据类型无效');
    const medicineId = integer(input.medicineId, '药品', 1), quantity = integer(input.quantity, '数量', 1), key = text(input.idempotencyKey, '请求标识', 100);
    const note = text(input.note || '', '备注', 200, true), party = text(input.party || '门诊药房', '往来单位', 80);
    const stamp = internal && input.date ? validDate(input.date, '单据') : date();
    const normalized = { medicineId, quantity, note, party, ...(type === 'inbound' ? { batchNo: text(input.batchNo, '批号', 50), expiryDate: validDate(input.expiryDate, '效期'), supplierId: integer(input.supplierId, '供应商', 1) } : {}) };
    if (type === 'inbound' && !internal && normalized.expiryDate < date()) throw new InventoryError('已过期药品不能入库');
    const fingerprint = createHash('sha256').update(JSON.stringify({ type, ...normalized })).digest('hex');
    return transaction(() => {
      const previous = db.prepare('SELECT * FROM documents WHERE idempotencyKey=?').get(key);
      if (previous) { if (previous.fingerprint !== fingerprint) throw new InventoryError('相同请求标识不能提交不同单据', 409); return { id: previous.id, duplicate: true }; }
      const m = db.prepare('SELECT * FROM medicines WHERE id=?').get(medicineId);
      if (!m) throw new InventoryError('药品档案不存在');
      const allocations = [];
      if (type === 'inbound') {
        if (!db.prepare('SELECT id FROM suppliers WHERE id=?').get(normalized.supplierId)) throw new InventoryError('供应商不存在');
        let batch = db.prepare('SELECT * FROM batches WHERE medicineId=? AND batchNo=?').get(medicineId, normalized.batchNo);
        if (batch && (batch.expiryDate !== normalized.expiryDate || batch.supplierId !== normalized.supplierId)) throw new InventoryError('同一药品批号的效期或供应商不一致');
        if (!batch) { const id = Number(db.prepare('INSERT INTO batches(medicineId,batchNo,expiryDate,supplierId,quantity) VALUES(?,?,?,?,0)').run(medicineId, normalized.batchNo, normalized.expiryDate, normalized.supplierId).lastInsertRowid); batch = { id }; }
        const current = db.prepare('SELECT quantity FROM batches WHERE id=?').get(batch.id).quantity;
        if (current + quantity > 1000000) throw new InventoryError('单一批次库存不能超过 1,000,000 件');
        db.prepare('UPDATE batches SET quantity=quantity+? WHERE id=?').run(quantity, batch.id);
        allocations.push({ batchId: batch.id, quantity });
      } else {
        const eligible = db.prepare('SELECT * FROM batches WHERE medicineId=? AND quantity>0 AND expiryDate>=? ORDER BY expiryDate,id').all(medicineId, stamp);
        if (eligible.reduce((sum, b) => sum + b.quantity, 0) < quantity) throw new InventoryError('可用库存不足：过期批次已自动排除', 409);
        let remaining = quantity;
        for (const batch of eligible) { if (!remaining) break; const take = Math.min(remaining, batch.quantity); db.prepare('UPDATE batches SET quantity=quantity-? WHERE id=? AND quantity>=?').run(take, batch.id, take); allocations.push({ batchId: batch.id, quantity: take }); remaining -= take; }
      }
      const id = `${type === 'inbound' ? 'RK' : 'CK'}-${stamp.replace(/-/g, '')}-${randomUUID().slice(0, 8).toUpperCase()}`;
      db.prepare('INSERT INTO documents VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(id, type, medicineId, quantity, m.priceCents, stamp, new Date().toISOString(), party, note, key, fingerprint);
      const line = db.prepare('INSERT INTO document_lines(documentId,batchId,quantity) VALUES(?,?,?)');
      for (const allocation of allocations) line.run(id, allocation.batchId, allocation.quantity);
      return { id, allocations, duplicate: false };
    });
  }
  function snapshot() {
    const today = date();
    const medicines = db.prepare(`SELECT m.*,COALESCE(SUM(b.quantity),0) stock,COALESCE(SUM(CASE WHEN b.expiryDate>=? THEN b.quantity ELSE 0 END),0) available,MIN(CASE WHEN b.quantity>0 THEN b.expiryDate END) nearestExpiry FROM medicines m LEFT JOIN batches b ON b.medicineId=m.id GROUP BY m.id ORDER BY m.id`).all(today);
    const batches = db.prepare(`SELECT b.*,m.name,m.spec,m.category,m.unit,m.location,m.priceCents,s.name supplier FROM batches b JOIN medicines m ON m.id=b.medicineId JOIN suppliers s ON s.id=b.supplierId ORDER BY b.expiryDate,b.id`).all();
    const lines = db.prepare('SELECT l.*,b.batchNo,b.expiryDate FROM document_lines l JOIN batches b ON l.batchId=b.id').all();
    const documents = db.prepare('SELECT d.*,m.name,m.spec,m.unit FROM documents d JOIN medicines m ON m.id=d.medicineId ORDER BY d.date DESC,d.createdAt DESC').all().map(d => ({ ...d, lines: lines.filter(l => l.documentId === d.id) }));
    const suppliers = db.prepare('SELECT * FROM suppliers ORDER BY id').all();
    const stock = batches.reduce((n, b) => n + b.quantity, 0), valueCents = batches.reduce((n, b) => n + b.quantity * b.priceCents, 0);
    const expired = batches.filter(b => b.quantity > 0 && b.expiryDate < today), expiring = batches.filter(b => b.quantity > 0 && b.expiryDate >= today && b.expiryDate <= offset(90));
    const low = medicines.filter(m => m.available < m.minStock);
    const trend = Array.from({ length: 7 }, (_, i) => offset(i - 6)).map(d => ({ date: d, inbound: documents.filter(r => r.date === d && r.type === 'inbound').reduce((s, r) => s + r.quantity, 0), outbound: documents.filter(r => r.date === d && r.type === 'outbound').reduce((s, r) => s + r.quantity, 0) }));
    const categories = [...new Set(medicines.map(m => m.category))].map(name => ({ name, value: medicines.filter(m => m.category === name).reduce((s, m) => s + m.stock, 0) })).filter(c => c.value > 0);
    return { medicines, suppliers, batches, documents, trend, categories, today, stats: { stock, valueCents, expired: expired.length, expiring: expiring.length, low: low.length, types: medicines.length, todayInbound: trend[6].inbound, todayOutbound: trend[6].outbound, documents: documents.length } };
  }
  function backup() { return { format: 'medistock', version: 1, exportedAt: new Date().toISOString(), medicines: db.prepare('SELECT * FROM medicines').all(), suppliers: db.prepare('SELECT * FROM suppliers').all(), batches: db.prepare('SELECT * FROM batches').all(), documents: db.prepare('SELECT * FROM documents').all(), lines: db.prepare('SELECT * FROM document_lines').all() }; }
  function restore(data) {
    if (!data || data.format !== 'medistock' || data.version !== 1) throw new InventoryError('仅支持 MediStock v1 完整备份格式');
    for (const key of ['medicines','suppliers','batches','documents','lines']) if (!Array.isArray(data[key]) || data[key].length > 10000 || data[key].some(row => !row || typeof row !== 'object' || Array.isArray(row))) throw new InventoryError('备份结构或数量无效');
    const medicineIds = new Set(), supplierIds = new Set(), batchIds = new Set(), documentIds = new Set(), lineIds = new Set(), requestKeys = new Set();
    const unique = (set, id) => { if (set.has(id)) throw new InventoryError('备份包含重复标识'); set.add(id); };
    data.medicines.forEach(m => { integer(m.id, '药品标识', 1); unique(medicineIds, m.id); medicine(m); });
    data.suppliers.forEach(s => { integer(s.id, '供应商标识', 1); unique(supplierIds, s.id); supplier(s); });
    data.batches.forEach(b => { integer(b.id, '批次标识', 1); unique(batchIds,b.id); text(b.batchNo,'批号',50); validDate(b.expiryDate,'效期'); integer(b.quantity,'库存'); if (!medicineIds.has(b.medicineId) || !supplierIds.has(b.supplierId)) throw new InventoryError('批次关联缺失'); });
    data.documents.forEach(d => { text(d.id,'单据标识',60); unique(documentIds,d.id); if (!['inbound','outbound'].includes(d.type) || !medicineIds.has(d.medicineId)) throw new InventoryError('单据关联或类型无效'); integer(d.quantity,'单据数量',1); integer(d.priceCents,'单价'); validDate(d.date,'单据'); text(d.createdAt,'创建时间',40); text(d.party,'往来单位',80); text(d.note,'备注',200,true); text(d.idempotencyKey,'请求标识',100); unique(requestKeys,d.idempotencyKey); if (!/^[a-f0-9]{64}$/.test(d.fingerprint)) throw new InventoryError('单据签名格式无效'); });
    const balance = new Map(data.batches.map(b => [b.id, 0]));
    data.lines.forEach(l => { integer(l.id,'明细标识',1); unique(lineIds,l.id); integer(l.quantity,'明细数量',1); if (!documentIds.has(l.documentId) || !batchIds.has(l.batchId)) throw new InventoryError('单据明细关联缺失'); const d = data.documents.find(d => d.id === l.documentId), b = data.batches.find(b => b.id === l.batchId); if (d.medicineId !== b.medicineId) throw new InventoryError('单据药品与批次不匹配'); if(d.date > b.expiryDate) throw new InventoryError('单据包含在流转当日已过期的批次'); balance.set(l.batchId, balance.get(l.batchId) + (d.type === 'inbound' ? 1 : -1) * l.quantity); });
    data.documents.forEach(d => {
      const details = data.lines.filter(l => l.documentId === d.id);
      if (details.reduce((s,l) => s + l.quantity,0) !== d.quantity) throw new InventoryError('单据数量与明细不一致');
      const normalized = { type:d.type,medicineId:d.medicineId,quantity:d.quantity,note:d.note,party:d.party };
      if(d.type === 'inbound') { if(details.length !== 1) throw new InventoryError('入库单只能对应一个批次'); const b = data.batches.find(b=>b.id===details[0].batchId);Object.assign(normalized,{batchNo:b.batchNo,expiryDate:b.expiryDate,supplierId:b.supplierId}); }
      if(createHash('sha256').update(JSON.stringify(normalized)).digest('hex') !== d.fingerprint) throw new InventoryError('单据内容与完整性校验不一致');
    });
    data.batches.forEach(b => { if (balance.get(b.id) !== b.quantity) throw new InventoryError('批次库存与单据账本不一致'); });
    return transaction(() => {
      db.exec('DELETE FROM document_lines;DELETE FROM documents;DELETE FROM batches;DELETE FROM medicines;DELETE FROM suppliers;');
      const inserts = { medicines: ['id','name','spec','category','unit','minStock','priceCents','location'], suppliers: ['id','name','contact','phone','city'], batches: ['id','medicineId','batchNo','expiryDate','supplierId','quantity'], documents: ['id','type','medicineId','quantity','priceCents','date','createdAt','party','note','idempotencyKey','fingerprint'], lines: ['id','documentId','batchId','quantity'] };
      for (const key of ['medicines','suppliers','batches','documents','lines']) { const cols = inserts[key]; const statement = db.prepare(`INSERT INTO ${key === 'lines' ? 'document_lines' : key}(${cols.join(',')}) VALUES(${cols.map(() => '?').join(',')})`); data[key].forEach(row => statement.run(...cols.map(c => row[c]))); }
      return { ok: true, medicines: data.medicines.length, documents: data.documents.length };
    });
  }
  function seedData() {
    if (db.prepare('SELECT COUNT(*) n FROM medicines').get().n) return;
    const suppliers = [['国药控股桂林有限公司','陈经理','0773-5821600','桂林'],['华润医药商业集团','林经理','0771-3251800','南宁'],['九州通医药集团','徐经理','027-84761888','武汉']];
    suppliers.forEach(s => saveSupplier({ name:s[0],contact:s[1],phone:s[2],city:s[3] }));
    const meds = [['阿莫西林胶囊','0.25g × 24粒','抗感染','盒',60,1680,'A-01'],['布洛芬缓释胶囊','0.3g × 24粒','解热镇痛','盒',50,2490,'A-02'],['维生素C片','100mg × 100片','营养补充','瓶',40,1280,'B-01'],['氯雷他定片','10mg × 10片','抗过敏','盒',30,1950,'A-03'],['奥美拉唑肠溶胶囊','20mg × 14粒','消化系统','盒',40,2260,'B-02'],['蒙脱石散','3g × 10袋','消化系统','盒',35,1870,'B-03'],['葡萄糖酸钙口服液','10ml × 12支','营养补充','盒',30,3250,'C-01'],['复方氨酚烷胺片','12片 / 盒','解热镇痛','盒',40,1580,'A-04']];
    meds.forEach(m => saveMedicine({name:m[0],spec:m[1],category:m[2],unit:m[3],minStock:m[4],priceCents:m[5],location:m[6]}));
    for (let i = 0; i < 8; i++) {
      submit('inbound',{medicineId:i+1,quantity:180+i*23,batchNo:`GL-${new Date().getFullYear()}-${String(i+1).padStart(3,'0')}`,expiryDate:offset(260+i*33),supplierId:i%3+1,party:suppliers[i%3][0],date:offset(-6),idempotencyKey:`seed-base-${i}`},true);
      if (i < 4) submit('inbound',{medicineId:i+1,quantity:80+i*12,batchNo:`GL-NEAR-${i+1}`,expiryDate:offset(24+i*12),supplierId:i%3+1,party:suppliers[i%3][0],date:offset(-5),idempotencyKey:`seed-near-${i}`},true);
    }
    submit('inbound',{medicineId:5,quantity:18,batchNo:'GL-HOLD-005',expiryDate:offset(-8),supplierId:2,party:suppliers[1][0],date:offset(-20),idempotencyKey:'seed-expired'},true);
    for (let i=0;i<12;i++) { const id=i%8+1; submit('outbound',{medicineId:id,quantity:12+i*3,party:i%2?'住院药房':'门诊药房',note:'演示出库单',date:offset(-5+i%6),idempotencyKey:`seed-out-${i}`},true); }
    submit('outbound',{medicineId:4,quantity:280,party:'门诊药房',date:date(),idempotencyKey:'seed-low'},true);
    submit('inbound',{medicineId:7,quantity:84,batchNo:'GL-TODAY-007',expiryDate:offset(500),supplierId:3,party:suppliers[2][0],date:date(),idempotencyKey:'seed-today'},true);
  }
  if (seed) seedData();
  return { db, snapshot, saveMedicine, saveSupplier, remove, submit, backup, restore, close: () => db.close() };
}
module.exports = { openInventory, InventoryError, date, offset };
