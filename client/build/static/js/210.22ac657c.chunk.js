"use strict";(self.webpackChunkticktac_client=self.webpackChunkticktac_client||[]).push([[210],{210:(e,t,a)=>{a.r(t),a.d(t,{default:()=>c});var s=a(43),l=a(216),o=a(213),n=a(579);const i=e=>{let{user:t,onLogout:a}=e;const[i,c]=(0,s.useState)(!1),[r,d]=(0,s.useState)(""),[u,m]=(0,s.useState)(""),[h,b]=(0,s.useState)(!1),p=(0,l.Zp)(),x=(0,s.useCallback)((async()=>{m(""),b(!0);try{const e=await o.A.post("/api/create-room"),{room_code:t}=e.data;p(`/game/${t}`)}catch(u){var e,t;m((null===(e=u.response)||void 0===e||null===(t=e.data)||void 0===t?void 0:t.error)||"Failed to create room!")}finally{b(!1)}}),[p]),g=(0,s.useCallback)((async e=>{e.preventDefault(),m(""),b(!0);try{if(!r||6!==r.length)throw new Error("Enter a valid 6-digit room code, you blind fuck!");p(`/game/${r}`)}catch(u){m(u.message)}finally{b(!1)}}),[r,p]),k=(0,s.useCallback)((()=>{p("/ai-game")}),[p]);return(0,n.jsxs)("div",{className:"container",children:[(0,n.jsxs)("h1",{className:"title",children:["Welcome to the Shitshow",t?`, ${t.username}`:"","!"]}),(0,n.jsxs)("div",{className:"menu",children:[(0,n.jsx)("button",{className:"button",onClick:x,disabled:h,children:"Create Room"}),(0,n.jsx)("button",{className:"button purple",onClick:()=>c((e=>!e)),disabled:h,children:i?"Hide Join Form":"Join Room"}),i&&(0,n.jsxs)("form",{onSubmit:g,style:{width:"100%"},children:[(0,n.jsx)("div",{className:"form-control",children:(0,n.jsx)("input",{type:"text",value:r,onChange:e=>d(e.target.value.slice(0,6)),placeholder:"Enter 6-digit room code",maxLength:6,disabled:h})}),(0,n.jsx)("button",{type:"submit",className:"button",disabled:h,children:"Join This Room"})]}),(0,n.jsx)("button",{className:"button",onClick:k,disabled:h,children:"Play vs AI"}),(0,n.jsx)("button",{className:"button purple",onClick:a,disabled:h,style:{marginTop:"20px"},children:"Logout"})]}),u&&(0,n.jsx)("div",{className:"error-message",children:u})]})},c=s.memo(i)}}]);
//# sourceMappingURL=210.22ac657c.chunk.js.map