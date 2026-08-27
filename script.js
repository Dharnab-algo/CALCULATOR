(function(){
  const exprEl = document.getElementById('expr');
  const resultEl = document.getElementById('result');
  const displayBox = document.getElementById('displayBox');
  const pad = document.getElementById('pad');

  let current = "0";      // current number being typed
  let previous = null;    // stored previous value
  let operator = null;    // pending operator
  let expressionText = ""; // text shown above (history line)
  let justEvaluated = false;

  function formatNumber(numStr){
    if (numStr === "Error") return numStr;
    let num = Number(numStr);
    if (!isFinite(num)) return "Error";
    let s = num.toString();
    if (s.length > 14) {
      s = num.toPrecision(10).toString();
      num = Number(s);
      s = num.toString();
    }
    return s;
  }

  function updateDisplay(opts={}){
    resultEl.textContent = current === "" ? "0" : current;
    exprEl.textContent = expressionText || "\u00a0";
    resultEl.classList.toggle('idle', !opts.pop);
    if (opts.pop){
      resultEl.classList.remove('pop');
      void resultEl.offsetWidth;
      resultEl.classList.add('pop');
    }
    resultEl.classList.toggle('glow', !!opts.glow);
  }

  function inputDigit(d){
    if (justEvaluated){
      current = d === "." ? "0." : d;
      expressionText = "";
      justEvaluated = false;
    } else if (current === "0" && d !== "."){
      current = d;
    } else if (d === "." && current.includes(".")){
      return;
    } else {
      current = current + d;
    }
    updateDisplay({pop:true});
  }

  function inputDot(){
    inputDigit(".");
  }

  function chooseOperator(sym){
    if (operator && previous !== null && !justEvaluated){
      compute();
    }
    previous = current;
    operator = sym;
    expressionText = previous + " " + sym;
    current = "0";
    justEvaluated = false;
    updateDisplay();
  }

  function compute(){
    if (operator === null || previous === null) return;
    const a = parseFloat(previous);
    const b = parseFloat(current);
    let res;
    try{
      switch(operator){
        case "+": res = a + b; break;
        case "−": res = a - b; break;
        case "×": res = a * b; break;
        case "÷":
          if (b === 0){ throw new Error("div0"); }
          res = a / b; break;
        default: return;
      }
    } catch(e){
      triggerError();
      return;
    }
    expressionText = previous + " " + operator + " " + current + " =";
    current = formatNumber(res.toString());
    previous = null;
    operator = null;
    justEvaluated = true;
    updateDisplay({pop:true, glow:true});
    setTimeout(()=> resultEl.classList.remove('glow'), 550);
  }

  function triggerError(){
    current = "Error";
    previous = null;
    operator = null;
    justEvaluated = true;
    expressionText = "";
    updateDisplay({pop:true});
    displayBox.classList.remove('shake');
    void displayBox.offsetWidth;
    displayBox.classList.add('shake');
  }

  function clearAll(){
    current = "0";
    previous = null;
    operator = null;
    expressionText = "";
    justEvaluated = false;
    updateDisplay();
  }

  function backspace(){
    if (justEvaluated) { clearAll(); return; }
    if (current.length <= 1 || (current.length===2 && current.startsWith('-'))){
      current = "0";
    } else {
      current = current.slice(0, -1);
    }
    updateDisplay();
  }

  function percent(){
    const num = parseFloat(current);
    if (isNaN(num)) return;
    current = formatNumber((num/100).toString());
    updateDisplay({pop:true});
  }

  function ripple(btn, evt){
    const circle = document.createElement('span');
    circle.className = 'ripple';
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    circle.style.width = circle.style.height = size + 'px';
    let x, y;
    if (evt && evt.clientX){
      x = evt.clientX - rect.left - size/2;
      y = evt.clientY - rect.top - size/2;
    } else {
      x = rect.width/2 - size/2;
      y = rect.height/2 - size/2;
    }
    circle.style.left = x + 'px';
    circle.style.top = y + 'px';
    btn.appendChild(circle);
    setTimeout(()=> circle.remove(), 500);
  }

  pad.addEventListener('click', (e) => {
    const btn = e.target.closest('button.key');
    if (!btn) return;
    ripple(btn, e);

    const action = btn.dataset.action;
    const value = btn.dataset.value;

    switch(action){
      case 'num': inputDigit(value); break;
      case 'dot': inputDot(); break;
      case 'op': chooseOperator(value); break;
      case 'clear': clearAll(); break;
      case 'backspace': backspace(); break;
      case 'percent': percent(); break;
      case 'equals':
        btn.classList.remove('pulse');
        void btn.offsetWidth;
        btn.classList.add('pulse');
        compute();
        break;
    }
  });

  window.addEventListener('keydown', (e) => {
    const k = e.key;
    let btn = null;
    if (/^[0-9]$/.test(k)){ inputDigit(k); btn = findBtn('num', k); }
    else if (k === '.'){ inputDot(); btn = findBtn('dot'); }
    else if (k === '+'){ chooseOperator('+'); btn = findBtn('op','+'); }
    else if (k === '-'){ chooseOperator('−'); btn = findBtn('op','−'); }
    else if (k === '*'){ chooseOperator('×'); btn = findBtn('op','×'); }
    else if (k === '/'){ e.preventDefault(); chooseOperator('÷'); btn = findBtn('op','÷'); }
    else if (k === 'Enter' || k === '='){ compute(); btn = findBtn('equals'); if(btn){btn.classList.remove('pulse'); void btn.offsetWidth; btn.classList.add('pulse');} }
    else if (k === 'Backspace'){ backspace(); btn = findBtn('backspace'); }
    else if (k === 'Escape'){ clearAll(); btn = findBtn('clear'); }
    else if (k === '%'){ percent(); btn = findBtn('percent'); }
    if (btn) ripple(btn);
  });

  function findBtn(action, value){
    if (value !== undefined){
      return pad.querySelector(`button[data-action="${action}"][data-value="${CSS.escape(value)}"]`);
    }
    return pad.querySelector(`button[data-action="${action}"]`);
  }

  updateDisplay();
})();
