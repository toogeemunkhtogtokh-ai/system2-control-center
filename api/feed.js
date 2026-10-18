module.exports = async function handler(req,res){
  if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).json({ok:false,error:"METHOD_NOT_ALLOWED"});}
  try{
    const upstream=process.env.SYSTEM2_FEED_URL;
    if(!upstream) return res.status(500).json({ok:false,error:"FEED_NOT_CONFIGURED"});
    const r=await fetch(upstream,{method:"GET",cache:"no-store"});
    const body=await r.text();
    res.status(r.status);
    res.setHeader("Content-Type",r.headers.get("content-type")||"application/json; charset=utf-8");
    res.setHeader("Cache-Control","no-store");
    return res.send(body);
  }catch(e){return res.status(502).json({ok:false,error:"FEED_UPSTREAM_ERROR"});}
};