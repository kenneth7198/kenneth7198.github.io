$(function(){
    const CARD = 150, T_LIMIT = 30, MAX = 10;
    const banks = ['combined', 'any2', 'any3'];
    let bank='', data=[], answer1='', answer2='', question='', user='',
        start=0, timerID, logged=false, solved=false;
    let total=0, records=[];
    
    const srcMap = {
      any3:'combined_idioms_fixed.json',
      any2:'any2words_idiom.json',
      combined:'combined_idioms_fixed.json'
    };
    
    function checkReady(){
      $('#startBtn').prop('disabled', !($('#userNameInput').val().trim()));
    }
    $('#userNameInput,#bankSelect').on('input change', checkReady);
    
    $('#startBtn').on('click', async ()=>{
      user = $('#userNameInput').val().trim();
      bank = banks[Math.floor(Math.random() * banks.length)];  // 隨機選題庫
      try {
        data = await (await fetch(srcMap[bank])).json();
      } catch {
        return alert('題庫載入失敗');
      }
      $('#mask').fadeOut();
      $('#randomBtn').prop('disabled', false);
      next();
    });
    
    function randomPosition(existingPositions) {
      const padding = 50;
      const safeDistance = 180;
      const maxX = window.innerWidth - CARD - padding;
      const maxY = window.innerHeight - 400;
      let tries = 0;
      while (tries < 1000) {
        const x = Math.floor(Math.random() * maxX) + padding;
        const y = Math.floor(Math.random() * maxY) + padding;
        let overlap = false;
        existingPositions.forEach(pos => {
          const dx = pos.x - x;
          const dy = pos.y - y;
          if (Math.sqrt(dx*dx + dy*dy) < safeDistance) {
            overlap = true;
          }
        });
        if (!overlap) return {x, y};
        tries++;
      }
      return {x: padding, y: padding};
    }
    
    function render(chars){
        $('.card').remove(); 
        $('#result').hide(); 
        $('#answerZone').css('border-color','#9ca3af'); 
        solved = false;
      
        let positions = [];
      
        chars.forEach((ch) => {
          const pos = randomPosition(positions);
          positions.push(pos);
      
          const rotateDeg = (Math.random() * 20 - 10).toFixed(2); // -10 ~ +10度 (正負皆可)
      
          $('<div class="card"/>').text(ch)
            .css({ left: pos.x, top: pos.y, opacity: 0, transform: `rotate(${rotateDeg}deg)` })
            .appendTo('body')
            .draggable({
              containment: 'body',
              start: function () {
                $(this).css('transform', `rotate(${rotateDeg}deg) scale(1.2)`).css('z-index', 999);
              },
              stop: function () {
                $(this).css('transform', `rotate(${rotateDeg}deg) scale(1)`).css('z-index', '');
                check();
              }
            })
            .animate({ opacity: 1 }, 500);
        });
      }
      
    
    function placed(){
      const t=$('#answerZone').position().top, b=t+$('#answerZone').outerHeight(), arr=[];
      $('.card').each(function(){const p=$(this).position(), m=p.top+CARD/2; if(m>t&&m<b) arr.push({l:p.left,ch:$(this).text()});});
      arr.sort((a,b)=>a.l-b.l); return arr.map(o=>o.ch).join('');
    }
    
    function startTimer(){
      start=Date.now(); logged=false; $('#timeoutMsg').hide(); $('#timer').text('⏱ 0 s');
      clearInterval(timerID);
      timerID=setInterval(()=>{
        let s=Math.floor((Date.now()-start)/1000);
        $('#timer').text(`⏱ ${s} s`);
        if(s>=T_LIMIT&&!logged) timeout(s);
      },1000);
    }
    
    function timeout(sec){
      let ansText=answer2?`${answer1} / ${answer2}`:answer1;
      $('#timeoutMsg').text(`⚠️ 超過 ${T_LIMIT} 秒！答案：${ansText}`).show();
      end('timeout',sec);
    }
    
    async function send(rec){rec.bank=bank;
      try{ await fetch('log.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(rec)}); }
      catch(e){console.error(e);}
    }
    
    async function end(status,sec){
      if(logged) return; logged=true; clearInterval(timerID);
      total+=sec;
      let rec={name:user,timestamp:new Date().toISOString(),seconds:sec,total,status,question,answer:answer1,final:placed()||''};
      records.push(rec); await send(rec);
      $('#scoreBoard').text(`${records.length} / ${MAX}`);
      if(records.length>=MAX){ $('#randomBtn').prop('disabled',true); summary(); }
    }
    
    $('#randomBtn').on('click', ()=>{ if(records.length<MAX) next(); });
    
    function next(){
      let it=data[Math.floor(Math.random()*data.length)];
      if(bank==='combined'){
        let gen=it.generated||''; answer1=gen.slice(0,4); question=shuffle(gen.slice(0,6).split('')).join('');
      }else{
        answer1=it.idiom1; answer2=it.idiom2||''; question=shuffle((bank==='any3'?it.question:it.question).slice(0,6).split('')).join('');
      }
      render(question.split('')); startTimer();
    }
    
    function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
    
    function check(){
      if(solved||logged) return;
      let cur=placed(); if(cur.length<4) return;
      let got=cur.slice(0,4);
      if(bank==='combined'){
        if(got===answer1) correct();
      }else{
        let answers=[answer1,answer2].filter(Boolean);
        if(answers.includes(got)) correct();
      }
    }
    
    $('#userNameInput').on('input', checkReady);

    function correct(){
      solved=true; $('#result').show(); $('#answerZone').css('border-color','#16a34a');
      let sec=Math.floor((Date.now()-start)/1000);
      end('solved',sec);
    }
    
    function summary(){
      let html='<h2 style="margin-top:0">測驗結束</h2>';
      html+=`<p>總花費時間：<span style="color:#2563eb;font-weight:700">${total}</span> 秒</p>`;
      html+='<table border="1" cellpadding="6" style="border-collapse:collapse;margin:auto"><tr>'+
            '<th>#</th><th>狀態</th><th>秒數</th><th>題目</th><th>正確答案</th></tr>';
      records.forEach((r,i)=>{
        let col=r.status==='solved'?'#2563eb':'#dc2626';
        html+=`<tr><td>${i+1}</td><td>${r.status}</td><td>${r.seconds}</td>`+
              `<td>${r.status==='solved'?'—':r.question}</td>`+
              `<td style="color:${col}">${r.answer}</td></tr>`;
      });
      html+='</table><br/><button id="chooseBankBtn">重新開始</button>';
      $('#summaryDlg').html(html).show();
      $('#chooseBankBtn').on('click',()=>{
        $('#summaryDlg').hide(); records=[]; total=0;
        $('#scoreBoard').text(`0 / ${MAX}`); $('#timer').text('⏱ 0 s');
        $('#mask').fadeIn(); $('#randomBtn').prop('disabled',true);
      });
    }
    });
    