module.exports = async function handler(req,res){
  if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({ok:false,error:"METHOD_NOT_ALLOWED"});}
  let body=req.body||{};
  if(typeof body==="string"){try{body=JSON.parse(body)}catch(e){return res.status(400).json({ok:false,error:"INVALID_JSON"})}}
  const action=String(body.action||"").toUpperCase();
  const pageKey=String(body.pageKey||"");
  const batchId=String(body.batchId||"");
  const confirm=String(body.confirm||"");
  if(!["PING","PAUSE","RESUME","REFILL","REFILL_APPROVE","REFILL_AUTO"].includes(action)) return res.status(400).json({ok:false,error:"INVALID_COMMAND"});
  if(pageKey==="SENSUS_JP" && action!=="PING") return res.status(403).json({ok:false,error:"SPECIAL_WORKFLOW_LOCKED"});
  if(action==="PAUSE" && confirm!=="SYSTEM2_V2_PAUSE") return res.status(400).json({ok:false,error:"BAD_CONFIRMATION"});
  if(action==="RESUME" && confirm!=="SYSTEM2_V2_RESUME") return res.status(400).json({ok:false,error:"BAD_CONFIRMATION"});
  if(action==="REFILL" && confirm!=="SYSTEM2_V2_REFILL") return res.status(400).json({ok:false,error:"BAD_CONFIRMATION"});
  if(action==="REFILL_APPROVE" && confirm!=="SYSTEM2_V2_REFILL_APPROVE") return res.status(400).json({ok:false,error:"BAD_CONFIRMATION"});
  if(action==="REFILL_AUTO" && confirm!=="SYSTEM2_V2_REFILL_AUTO") return res.status(400).json({ok:false,error:"BAD_CONFIRMATION"});
  if(action==="REFILL_AUTO"){
    let p;
    try{p=JSON.parse(batchId);}catch(e){return res.status(400).json({ok:false,error:"INVALID_AUTO_REFILL_PAYLOAD"});}
    const batches=Array.isArray(p?.batches)?p.batches:null;
    if(!batches?.length || batches.length>10) return res.status(400).json({ok:false,error:"INVALID_AUTO_REFILL_BATCHES"});
    const bad=batches.some(b=>
      !b || typeof b!=="object" ||
      String(b.pageKey||"")!==pageKey ||
      !String(b.jobId||"") ||
      !String(b.pageName||"") ||
      !Number.isInteger(Number(b.batchSize)) ||
      Number(b.batchSize)<1 || Number(b.batchSize)>10 ||
      !String(b.publishWindow||"") ||
      !String(b.contentRules||"")
    );
    if(bad) return res.status(400).json({ok:false,error:"INVALID_AUTO_REFILL_BATCH"});
  }
  if(action==="REFILL_APPROVE"){
    let p;
    try{p=JSON.parse(batchId);}catch(e){return res.status(400).json({ok:false,error:"INVALID_REFILL_PAYLOAD"});}
    const d=Array.isArray(p?.data)?p.data[0]:null;
    const rows=Array.isArray(d?.values)?d.values:null;
    const range=String(d?.range||"");
    if(p?.valueInputOption!=="USER_ENTERED" || !/^Publisher!A\d+:L\d+$/.test(range) || !rows?.length || rows.length>20){
      return res.status(409).json({ok:false,error:"REFILL_APPROVE_PAYLOAD_VERSION_MISMATCH",hint:"Refresh dashboard and try again."});
    }
    if(rows.some(r=>!Array.isArray(r) || r.length!==12 || String(r[1]||"")!==pageKey || !["READY","IMAGE_PENDING"].includes(String(r[5]||"").toUpperCase()))){
      return res.status(400).json({ok:false,error:"INVALID_READY_ROWS"});
    }
  }
  try{
    const upstream=process.env.SYSTEM2_CONTROL_URL;
    if(!upstream) return res.status(500).json({ok:false,error:"CONTROL_NOT_CONFIGURED"});
    const r=await fetch(upstream,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({action,pageKey,batchId,confirm}),
      cache:"no-store"
    });
    const txt=await r.text();
    res.status(r.status);
    res.setHeader("Content-Type",r.headers.get("content-type")||"application/json; charset=utf-8");
    res.setHeader("Cache-Control","no-store");
    return res.send(txt);
  }catch(e){return res.status(502).json({ok:false,error:"CONTROL_UPSTREAM_ERROR"});}
};