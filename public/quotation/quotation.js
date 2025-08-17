/*globals jspdf*/
const { jsPDF } = window.jspdf;
const form    = document.getElementById('quoteForm');
const preview = document.getElementById('previewFrame');
const addRow  = document.getElementById('addRow');
const tbody   = document.querySelector('#itemsTbl tbody');

addRow.onclick = () => tbody.insertAdjacentHTML(
  'beforeend',
  `<tr>
     <td><input></td><td><input></td><td><input type="number" value="1"></td>
     <td><input value="nos"></td><td><input type="number"></td>
     <td><input type="number" value="9"></td><td><input type="number" value="9"></td>
   </tr>`
);
addRow.click(); // one default row

document.getElementById('previewBtn').onclick  = () => renderPdf(true);
document.getElementById('downloadBtn').onclick = () => renderPdf(false);
form.onsubmit = saveQuotation; // POST to server

function getFormData() {
  const fd = new FormData(form);
  const data = Object.fromEntries(fd.entries());

  // items
  data.items = [...tbody.rows].map(r => {
    const [desc, hsn, qty, unit, rate, cgst, sgst] =
      [...r.querySelectorAll('input')].map(i => i.value.trim());
    if (!desc) return null;          // ignore blank rows
    return { desc, hsn, qty, unit, rate, cgst, sgst };
  }).filter(Boolean);

  return data;
}

function renderPdf(toPreview) {
  const d = getFormData();
  const doc = new jsPDF({orientation:'p', unit:'mm', format:'a4'});

  // ── HEADER (fixed) ───────────────────────────────────
  doc.setFillColor(240, 95, 0);
  doc.rect(0,0,210,28,'F');
  doc.setFontSize(16).setTextColor(255,255,255)
     .text('SAMPS GROUP', 10, 18);
  doc.setFontSize(9).text('GST: 09BZAPS9074A1Z7', 150, 10,{align:'right'});
  doc.text('Phone: 8382828234  |  Email: sampsinstruments@gmail.com',150,16,{align:'right'});

  // ── QUOTATION META ──────────────────────────────────
  let y = 36;
  doc.setFontSize(14).setTextColor(0);
  doc.text('QUOTATION', 10, y);
  doc.setFontSize(10);
  y += 6;
  if (d.number)    doc.text(`Quotation No.: ${d.number}`, 10, y);
  if (d.date)      doc.text(`Date: ${formatDate(d.date)}`, 80, y);
  if (d.validTill) doc.text(`Valid till: ${formatDate(d.validTill)}`,140,y);
  if (d.reference){ y+=6; doc.text(`Ref.: ${d.reference}`,10,y); }

  // ── ADDRESSES ───────────────────────────────────────
  y += 10;
  if (d.billing) {
    doc.setFontSize(11).text('Billing Address',10,y);
    doc.setFontSize(10).text(d.billing,10,y+5);
  }
  if (d.shipping) {
    doc.setFontSize(11).text('Shipping Address',110,y);
    doc.setFontSize(10).text(d.shipping,110,y+5);
  }
  y += d.billing || d.shipping ? 25 : 0;

  // ── ITEMS TABLE ─────────────────────────────────────
  const tableBody = d.items.map((it,i) => [
    i+1, it.desc,
    it.hsn || '-', it.qty||'-', it.unit||'-',
    money(it.rate), pct(it.cgst), pct(it.sgst),
    money(it.qty*it.rate*(1+it.cgst/100+it.sgst/100))
  ]);
  doc.autoTable({
    startY: y,
    head:[['#','Item & Description','HSN/SAC','Qty','Unit',
           'Rate','CGST','SGST','Amount']],
    body: tableBody,
    styles:{fontSize:8,cellPadding:2},
    headStyles:{fillColor:[240,95,0],textColor:255,fontStyle:'bold'},
    theme:'grid'
  });
  y = doc.lastAutoTable.finalY + 4;

  // ── BANK DETAILS ────────────────────────────────────
  if (d.bankName) {
    doc.setFontSize(11).text('Bank Details:',10,y);
    doc.setFontSize(9);
    y+=5;
    doc.text(`Bank: ${d.bankName}`,10,y);
    if (d.branch)   doc.text(`Branch: ${d.branch}`,60,y);
    if (d.account)  doc.text(`A/C No.: ${d.account}`,110,y);
    if (d.ifsc)     doc.text(`IFSC: ${d.ifsc}`,10,y+5);
    y+=10;
  }

  // ── TERMS & CONDITIONS ──────────────────────────────
  if (d.terms) {
    doc.setFontSize(11).text('Terms & Conditions:',10,y);
    doc.setFontSize(9).text(d.terms,10,y+5,{maxWidth:190});
    y = doc.lastAutoTable ? doc.lastAutoTable.finalY+10 : y+25;
  }

  // ── FOOTER (fixed) ─────────────────────────────────
  const pageH = doc.internal.pageSize.height;
  doc.setLineWidth(0.1).line(10,pageH-20,200,pageH-20);
  doc.setFontSize(9).text('This is a computer-generated quotation.',10,pageH-14);
  doc.text('For, SAMPS GROUP',150,pageH-14);
  doc.text('Authorised Signatory',150,pageH-8);

  // ── OUTPUT ─────────────────────────────────────────
  if (toPreview) {
    preview.src = doc.output('dataurlstring');
  } else {
    doc.save(`Quotation_${d.number||Date.now()}.pdf`);
  }
}

function formatDate(d){
  return new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
}
const money = v => v ? (+v).toLocaleString('en-IN',{style:'currency',currency:'INR',minimumFractionDigits:2}).replace('₹','₹ ') : '-';
const pct   = v => v ? `${v}%` : '-';

// ── SAVE TO SERVER (optional) ─────────────────────────
async function saveQuotation(e){
  e.preventDefault();
  const res = await fetch('/api/quotations',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(getFormData())
  });
  const out = await res.json();
  alert(out.message||'Saved!');
}
