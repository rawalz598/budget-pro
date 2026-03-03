let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

const balanceEl = document.getElementById("balance");
const totalIncomeEl = document.getElementById("totalIncome");
const totalExpenseEl = document.getElementById("totalExpense");
const transactionList = document.getElementById("transactionList");

function addTransaction() {
  const description = document.getElementById("description").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const type = document.getElementById("type").value;

  if (!description || !amount) return;

  const transaction = { description, amount, type };
  transactions.push(transaction);
  localStorage.setItem("transactions", JSON.stringify(transactions));

  renderTransactions();
  updateBalance();

  document.getElementById("description").value = "";
  document.getElementById("amount").value = "";
}

function removeTransaction(index) {
  transactions.splice(index, 1);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  renderTransactions();
  updateBalance();
}

function renderTransactions() {
  transactionList.innerHTML = "";
  transactions.forEach((t, i) => {
    const li = document.createElement("li");
    li.className = `transaction ${t.type}`;
    li.innerHTML = `
      <span>${t.description}: $${t.amount.toFixed(2)}</span>
      <button onclick="removeTransaction(${i})">X</button>
    `;
    transactionList.appendChild(li);
  });
}

function updateBalance() {
  let balance = 0;
  let income = 0;
  let expense = 0;

  transactions.forEach(t => {
    if (t.type === "income") {
      income += t.amount;
      balance += t.amount;
    } else {
      expense += t.amount;
      balance -= t.amount;
    }
  });

  balanceEl.textContent = `$${balance.toFixed(2)}`;
  totalIncomeEl.textContent = `$${income.toFixed(2)}`;
  totalExpenseEl.textContent = `$${expense.toFixed(2)}`;
}

// Initial render
renderTransactions();
updateBalance();