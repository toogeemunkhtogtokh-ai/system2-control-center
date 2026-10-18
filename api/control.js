module.exports = async function handler(req,res){
  if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({ok:false,error:"METHOD_NOT_ALLOWED"});}
  let body=req.body||{};
  if(typeof body==="string"){try{body=JSON.parse(body)}catch(e){return res.status(400).json({ok:false,error:"INVALID_JSON"})}}
  const action=String(body.action||"").toUpperCase();
  const pageKey=String(body.pageKey||"");
  const batchId=String(body.batchId||"");
  const confirm=String(body.confirm||"");
  if(!["PING","PAUSE","RESUME","REFILL","REFILL_APPROVE"].includes(action)) return res.status(400).json({ok:false,error:"INVALID_COMMAND"});
  if(pageKey==="SENSUS_JP" && action!=="PING") return res.status(403).json({ok:false,error:"SPECIAL_WORKFLOW_LOCKED"});
  if(action==="PAUSE" && confirm!=="SYSTEM2_V2_PAUSE") return res.status(400).json({ok:false,error:"BAD_CONFIRMATION"});
  if(action==="RESUME" && confirm!=="SYSTEM2_V2_RESUME") return res.status(400).json({ok:false,error:"BAD_CONFIRMATION"});
  if(action==="REFILL" && confirm!=="SYSTEM2_V2_REFILL") return res.status(400).json({ok:false,error:"BAD_CONFIRMATION"});
  if(action==="REFILL_APPROVE" && confirm!=="SYSTEM2_V2_REFILL_APPROVE") return res.status(400).json({ok:false,error:"BAD_CONFIRMATION"});
  try{
    const upstream=process.env.SYSTEM2_CONTROL_URL;
    if(!upstream) return res.status(500).json({ok:false,error:"CONTROL_NOT_CONFIGURED"});
    const u=new URL(upstream);
    u.search=new URLSearchParams({action,pageKey,batchId,confirm}).toString();
    const r=await fetch(u,{method:"GET",cache:"no-store"});
    const txt=await r.text();
    res.status(r.status);
    res.setHeader("Content-Type",r.headers.get("content-type")||"application/json; charset=utf-8");
    res.setHeader("Cache-Control","no-store");
    return res.send(txt);
  }catch(e){return res.status(502).json({ok:false,error:"CONTROL_UPSTREAM_ERROR"});}
};