"use strict";(self.webpackChunkticktac_client=self.webpackChunkticktac_client||[]).push([[529],{529:(e,s,a)=>{a.r(s),a.d(s,{default:()=>m});var t=a(43),o=a(216),n=a(104),c=a(579);const l=e=>{let{user:s,onLogout:a}=e;const l=(0,o.Zp)(),[m,r]=(0,t.useState)(null),[i,u]=(0,t.useState)(null),[d,_]=(0,t.useState)(null),[g,h]=(0,t.useState)("Starting AI game..."),[f,v]=(0,t.useState)(!1),[k,b]=(0,t.useState)(""),[x,p]=(0,t.useState)("");(0,t.useEffect)((()=>{const e=(0,n.io)();return r(e),()=>{e.disconnect()}}),[]),(0,t.useEffect)((()=>{if(m&&s)return m.on("connect",(()=>{m.emit("play_vs_ai")})),m.on("error",(e=>{p(e.message),setTimeout((()=>{l("/home")}),3e3)})),m.on("ai_game_started",(e=>{u(e.game_state),_(e.room_code),h(e.message)})),m.on("move_made",(e=>{u(e.game_state),h("AI is thinking...")})),m.on("ai_move_made",(e=>{u(e.game_state),h("Your move, asshole!");const s=document.querySelector(".game-status");s&&(s.classList.add("shake"),setTimeout((()=>{s.classList.remove("shake")}),500))})),m.on("game_over",(e=>{u(e.game_state),h(e.message),b("Game's over, you chaotic bastards! Thanks for the mess!"),v(!0),setTimeout((()=>{v(!1)}),4e3)})),m.on("game_reset",(e=>{u(e.game_state),h("Game reset! Your move, asshole!")})),()=>{m.off("connect"),m.off("error"),m.off("ai_game_started"),m.off("move_made"),m.off("ai_move_made"),m.off("game_over"),m.off("game_reset")}}),[m,s,l]);const j=(0,t.useCallback)((e=>{m&&i&&d&&"X"===i.current_turn&&null===i.board[e]&&"playing"===i.status&&m.emit("make_move_vs_ai",{room_code:d,cell_index:e})}),[m,i,d]),N=(0,t.useCallback)((()=>{m&&d&&m.emit("reset_game",{room_code:d})}),[m,d]),C=(0,t.useCallback)((()=>{l("/home")}),[l]),S=(0,t.useMemo)((()=>i?(0,c.jsx)("div",{className:"game-board",children:i.board.map(((e,s)=>(0,c.jsx)("div",{className:`cell ${e?e.toLowerCase():""}`,onClick:()=>j(s),children:e},s)))}):null),[i,j]);return x?(0,c.jsxs)("div",{className:"container",children:[(0,c.jsx)("h1",{className:"title",children:"Error"}),(0,c.jsx)("div",{className:"error-message",children:x}),(0,c.jsx)("button",{className:"button",onClick:C,children:"Back to Home"})]}):(0,c.jsxs)("div",{className:"container",children:[f&&(0,c.jsx)("div",{className:"game-over-banner",children:k}),(0,c.jsx)("h1",{className:"title",children:"Playing vs. AI"}),(0,c.jsx)("div",{className:"game-status",children:g}),S,(0,c.jsxs)("div",{style:{display:"flex",gap:"10px",marginTop:"20px"},children:[(0,c.jsx)("button",{className:"button",onClick:N,disabled:!i||"winner"!==i.status&&"tie"!==i.status,children:"Reset Game"}),(0,c.jsx)("button",{className:"button purple",onClick:C,children:"Back to Home"})]})]})},m=t.memo(l)}}]);
//# sourceMappingURL=529.83dc2726.chunk.js.map