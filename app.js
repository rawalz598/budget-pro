import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  orderBy
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

/** Firebase config */
const firebaseConfig = {
  apiKey: "AIzaSyCelkKn71my1hjGKpdhI0TNKwslZQQJf-0",
  authDomain: "budgetpro-81f62.firebaseapp.com",
  projectId: "budgetpro-81f62",
  storageBucket: "budgetpro-81f62.firebasestorage.app",
  messagingSenderId: "38847065741",
  appId: "1:38847065741:web:6bea0d3193af2fdd3f3cc4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/** AUTH DOM */
const authWrapper = document.getElementById("auth-wrapper");
const loginScreen = document.getElementById("login-screen");
const signupScreen = document.getElementById("signup-screen");

const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginBtn = document.getElementById("login-btn");
const goSignupBtn = document.getElementById("go-signup-btn");
const resetBtn = document.getElementById("reset-btn");

const signupEmail = document.getElementById("signup-email");
const signupPassword = document.getElementById("signup-password");
const signupConfirm = document.getElementById("signup-confirm");
const signupBtn = document.getElementById("signup-btn");
const backLoginBtn = document.getElementById("back-login-btn");

/** APP DOM */
const appScreen = document.getElementById("app-screen");
const logoutBtn = document.getElementById("logout-btn");
const userEmailEl = document.getElementById("user-email");

const toggleThemeBtn = document.getElementById("toggle-theme");

const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");
const currentMonthEl = document.getElementById("current-month");

const entryTitle = document.getElementById("entry-title");
const typeSelect = document.getElementById("type");
const amountInput = document.getElementById("amount");
const categorySelect = document.getElementById("category");
const nameInput = document.getElementById("name");
const saveBtn = document.getElementById("save-btn");
const clearBtn = document.getElementById("clear-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");

const newCategoryInput = document.getElementById("new-category");
const addCategoryBtn = document.getElementById("add-category-btn");
const categoryListEl = document.getElementById("category-list");

const txList = document.getElementById("transaction-list");
const reportList = document.getElementById("report-list");
const txCount = document.getElementById("tx-count");

const statIncome = document.getElementById("stat-income");
const statExpense = document.getElementById("stat-expense");
const statNet = document.getElementById("stat-net");

/** State */
let currentUser = null;
let monthOffset = 0;
let categories = [];
let editingTxId = null;

const DEFAULT_CATEGORIES = ["Rent", "Groceries", "Utilities", "Amazon", "Gas", "Eating Out", "Other"];

/** Theme */
toggleThemeBtn?.addEventListener("click", () => {
  document.body.classList.toggle("light");
});

/** Helpers */
function cleanStr(s) { return String(s || "").trim(); }

function monthLabel(d) {
  return d.toLocaleString("default", { month: "long", year: "numeric" });
}
function getMonthRange(offset) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1, 0, 0, 0, 0);
  return { start, end };
}
function money(n) {
  const x = Number(n || 0);
  return `$${x.toFixed(2)}`;
}
function toDate(val) {
  if (!val) return new Date();
  if (val instanceof Date) return val;
  if (val.seconds) return new Date(val.seconds * 1000);
  return new Date(val);
}
function setEditMode(on) {
  if (on) {
    entryTitle.textContent = "Edit transaction";
    cancelEditBtn.classList.remove("hidden");
  } else {
    entryTitle.textContent = "Add transaction";
    cancelEditBtn.classList.add("hidden");
    editingTxId = null;
  }
}

/** Auth screen switching */
function showLogin() {
  loginScreen.classList.remove("hidden");
  signupScreen.classList.add("hidden");
}
function showSignup() {
  signupScreen.classList.remove("hidden");
  loginScreen.classList.add("hidden");
}

goSignupBtn?.addEventListener("click", () => showSignup());
backLoginBtn?.addEventListener("click", () => showLogin());

/** LOGIN */
loginBtn?.addEventListener("click", async () => {
  const email = cleanStr(loginEmail.value);
  const pass = String(loginPassword.value || "");

  if (!email || !pass) return alert("Enter email and password.");

  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (error) {
    if (error.code === "auth/wrong-password" || error.code === "auth/invalid-login-credentials") {
      alert("Wrong password. Try again or use 'Forgot password'.");
    } else if (error.code === "auth/user-not-found") {
      alert("No account found with that email. Click 'Create account'.");
    } else if (error.code === "auth/invalid-email") {
      alert("That email doesn’t look valid.");
    } else {
      alert(error.message);
    }
  }
});

/** SIGNUP */
signupBtn?.addEventListener("click", async () => {
  const email = cleanStr(signupEmail.value);
  const pass = String(signupPassword.value || "");
  const confirm = String(signupConfirm.value || "");

  if (!email || !pass || !confirm) return alert("Fill in all fields.");
  if (pass.length < 6) return alert("Password must be at least 6 characters.");
  if (pass !== confirm) return alert("Passwords do not match.");

  try {
    await createUserWithEmailAndPassword(auth, email, pass);
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      alert("This email already has an account. Go back and log in.");
    } else if (error.code === "auth/invalid-email") {
      alert("That email doesn’t look valid.");
    } else {
      alert(error.message);
    }
  }
});

/** FORGOT PASSWORD */
resetBtn?.addEventListener("click", async () => {
  const email = cleanStr(loginEmail.value);
  if (!email) return alert("Enter your email first, then click Forgot password.");

  try {
    await sendPasswordResetEmail(auth, email);
    alert("Reset email sent. Check your inbox (and spam).");
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      alert("No account found with that email.");
    } else if (error.code === "auth/invalid-email") {
      alert("That email doesn’t look valid.");
    } else {
      alert(error.message);
    }
  }
});

/** LOGOUT */
logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
});

/** Categories */
function renderCategories() {
  categorySelect.innerHTML = "";

  if (!categories || categories.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No categories yet — add one below";
    categorySelect.appendChild(opt);
    categorySelect.disabled = true;
    return;
  }

  categorySelect.disabled = false;
  for (const c of categories) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    categorySelect.appendChild(opt);
  }
}

function renderCategoryList(catDocs) {
  if (!categoryListEl) return;
  categoryListEl.innerHTML = "";

  if (!catDocs || catDocs.length === 0) {
    const li = document.createElement("li");
    li.className = "cat-item";
    li.innerHTML = `<span class="muted">No saved categories yet.</span>`;
    categoryListEl.appendChild(li);
    return;
  }

  const sorted = [...catDocs].sort((a, b) => a.name.localeCompare(b.name));

  for (const c of sorted) {
    const li = document.createElement("li");
    li.className = "cat-item";

    const name = document.createElement("span");
    name.textContent = c.name;

    const del = document.createElement("button");
    del.className = "icon-btn danger";
    del.type = "button";
    del.textContent = "Delete";
    del.addEventListener("click", async () => {
      const ok = confirm(`Delete category "${c.name}"? (Old transactions will still show it.)`);
      if (!ok) return;

      try {
        await deleteDoc(doc(db, "categories", c.id));
        await loadCategories();
      } catch (e) {
        alert("Could not delete category: " + e.message);
      }
    });

    li.appendChild(name);
    li.appendChild(del);
    categoryListEl.appendChild(li);
  }
}

async function ensureDefaultCategories() {
  const catRef = collection(db, "categories");
  const snap = await getDocs(query(catRef, where("uid", "==", currentUser.uid)));

  if (snap.empty) {
    for (const c of DEFAULT_CATEGORIES) {
      await addDoc(catRef, { uid: currentUser.uid, name: c, createdAt: new Date() });
    }
  }
}

async function loadCategories() {
  try {
    categorySelect.disabled = true;
    categorySelect.innerHTML = `<option>Loading categories...</option>`;

    const catRef = collection(db, "categories");
    const snap = await getDocs(query(catRef, where("uid", "==", currentUser.uid)));

    const catDocs = snap.docs
      .map(d => ({ id: d.id, name: d.data().name }))
      .filter(x => x.name);

    categories = catDocs.map(x => x.name).sort((a, b) => a.localeCompare(b));
    if (!categories.length) categories = [...DEFAULT_CATEGORIES];

    renderCategories();
    renderCategoryList(catDocs);
  } catch (e) {
    alert("Could not load categories: " + e.message);
    categories = [...DEFAULT_CATEGORIES];
    renderCategories();
    renderCategoryList([]);
  }
}

addCategoryBtn?.addEventListener("click", async () => {
  if (!currentUser) return;

  const name = cleanStr(newCategoryInput.value);
  if (!name) return alert("Type a category name first.");

  if (categories.map(x => x.toLowerCase()).includes(name.toLowerCase())) {
    newCategoryInput.value = "";
    return alert("That category already exists.");
  }

  try {
    await addDoc(collection(db, "categories"), {
      uid: currentUser.uid,
      name,
      createdAt: new Date()
    });
    newCategoryInput.value = "";
    await loadCategories();
  } catch (e) {
    alert("Could not add category: " + e.message);
  }
});

/** Transactions */
saveBtn?.addEventListener("click", async () => {
  if (!currentUser) return;

  const type = typeSelect.value;
  const category = categorySelect.value;
  const amount = Number(amountInput.value);
  const name = cleanStr(nameInput.value);

  if (!category) return alert("Please select a category.");
  if (!Number.isFinite(amount) || amount <= 0) return alert("Please enter a valid amount.");

  if (editingTxId) {
    await updateDoc(doc(db, "transactions", editingTxId), { type, category, name, amount });
    setEditMode(false);
  } else {
    await addDoc(collection(db, "transactions"), {
      uid: currentUser.uid,
      type,
      category,
      name,
      amount,
      date: new Date()
    });
  }

  amountInput.value = "";
  nameInput.value = "";
  await refreshMonth();
});

clearBtn?.addEventListener("click", () => {
  nameInput.value = "";
  amountInput.value = "";
});

cancelEditBtn?.addEventListener("click", () => {
  setEditMode(false);
  nameInput.value = "";
  amountInput.value = "";
});

function txRow(tx) {
  const li = document.createElement("li");
  li.className = "tx-item";

  const left = document.createElement("div");
  left.className = "tx-left";

  const title = document.createElement("div");
  title.className = "tx-title";
  title.textContent = tx.name?.trim() ? tx.name.trim() : tx.category;

  const meta = document.createElement("div");
  meta.className = "tx-meta";
  const d = toDate(tx.date);
  meta.textContent = `${tx.category} • ${d.toLocaleDateString()}`;

  left.appendChild(title);
  left.appendChild(meta);

  const right = document.createElement("div");
  right.className = "tx-right";

  const badge = document.createElement("div");
  badge.className = `badge ${tx.type}`;
  badge.textContent = tx.type === "income" ? "Income" : "Expense";

  const amt = document.createElement("div");
  amt.className = "tx-amt";
  amt.textContent = money(tx.amount);
  amt.style.color = tx.type === "income" ? "var(--primary)" : "var(--danger)";

  const editBtn = document.createElement("button");
  editBtn.className = "icon-btn";
  editBtn.type = "button";
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", () => {
    typeSelect.value = tx.type || "expense";
    amountInput.value = tx.amount ?? "";
    nameInput.value = tx.name || "";

    if (!categories.includes(tx.category)) {
      categories.push(tx.category);
      categories.sort((a, b) => a.localeCompare(b));
      renderCategories();
    }
    categorySelect.value = tx.category;

    editingTxId = tx.id;
    setEditMode(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  const delBtn = document.createElement("button");
  delBtn.className = "icon-btn danger";
  delBtn.type = "button";
  delBtn.textContent = "Delete";
  delBtn.addEventListener("click", async () => {
    const ok = confirm("Delete this transaction?");
    if (!ok) return;
    await deleteDoc(doc(db, "transactions", tx.id));
    if (editingTxId === tx.id) setEditMode(false);
    await refreshMonth();
  });

  right.appendChild(badge);
  right.appendChild(amt);
  right.appendChild(editBtn);
  right.appendChild(delBtn);

  li.appendChild(left);
  li.appendChild(right);
  return li;
}

async function loadTransactionsForMonth(offset) {
  const { start, end } = getMonthRange(offset);
  currentMonthEl.textContent = monthLabel(start);

  txList.innerHTML = "";
  reportList.innerHTML = "";
  txCount.textContent = "0 items";

  const txRef = collection(db, "transactions");
  const qTx = query(
    txRef,
    where("uid", "==", currentUser.uid),
    where("date", ">=", start),
    where("date", "<", end),
    orderBy("date", "desc")
  );

  const snap = await getDocs(qTx);
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  items.forEach(tx => txList.appendChild(txRow(tx)));
  txCount.textContent = `${items.length} item${items.length === 1 ? "" : "s"}`;

  let income = 0;
  let expense = 0;
  const catTotals = {};

  for (const tx of items) {
    const amt = Number(tx.amount || 0);
    if (tx.type === "income") income += amt;
    else expense += amt;

    const key = `${tx.type}:${tx.category}`;
    catTotals[key] = (catTotals[key] || 0) + amt;
  }

  statIncome.textContent = money(income);
  statExpense.textContent = money(expense);
  statNet.textContent = money(income - expense);
  statNet.style.color = (income - expense) >= 0 ? "var(--primary)" : "var(--danger)";

  const entries = Object.entries(catTotals).sort((a,b)=>b[1]-a[1]);
  if (!entries.length) {
    const li = document.createElement("li");
    li.className = "tx-item";
    li.textContent = "No transactions for this month yet.";
    reportList.appendChild(li);
    return;
  }

  entries.forEach(([key, amt]) => {
    const [type, cat] = key.split(":");
    const li = document.createElement("li");
    li.className = "tx-item";

    const left = document.createElement("div");
    left.className = "tx-left";

    const title = document.createElement("div");
    title.className = "tx-title";
    title.textContent = cat;

    const meta = document.createElement("div");
    meta.className = "tx-meta";
    meta.textContent = type === "income" ? "Income total" : "Expense total";

    left.appendChild(title);
    left.appendChild(meta);

    const right = document.createElement("div");
    right.className = "tx-right";

    const badge = document.createElement("div");
    badge.className = `badge ${type}`;
    badge.textContent = type === "income" ? "Income" : "Expense";

    const val = document.createElement("div");
    val.className = "tx-amt";
    val.textContent = money(amt);
    val.style.color = type === "income" ? "var(--primary)" : "var(--danger)";

    right.appendChild(badge);
    right.appendChild(val);

    li.appendChild(left);
    li.appendChild(right);

    reportList.appendChild(li);
  });
}

async function refreshMonth() {
  if (!currentUser) return;
  await loadTransactionsForMonth(monthOffset);
}

prevMonthBtn?.addEventListener("click", () => { monthOffset -= 1; refreshMonth(); });
nextMonthBtn?.addEventListener("click", () => { monthOffset += 1; refreshMonth(); });

/** Auth state */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    currentUser = null;
    appScreen.classList.add("hidden");
    authWrapper.classList.remove("hidden");
    showLogin();
    setEditMode(false);
    return;
  }

  currentUser = user;

  // clear auth inputs
  loginPassword.value = "";
  signupPassword.value = "";
  signupConfirm.value = "";

  userEmailEl.textContent = user.email;

  authWrapper.classList.add("hidden");
  appScreen.classList.remove("hidden");

  await ensureDefaultCategories();
  await loadCategories();
  await refreshMonth();
});