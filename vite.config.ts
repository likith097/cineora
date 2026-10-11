import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({mode})=>{
  const env=loadEnv(mode,process.cwd(),'');
  return {plugins:[react()],server:{proxy:{'/api/tmdb':{target:'https://api.themoviedb.org',changeOrigin:true,rewrite:p=>p.replace(/^\/api\/tmdb/,'/3'),configure:proxy=>{proxy.on('proxyReq',req=>{if(env.TMDB_READ_TOKEN)req.setHeader('Authorization',`Bearer ${env.TMDB_READ_TOKEN}`);});}}}}};
});
