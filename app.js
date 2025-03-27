



import {  initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";





import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} 


from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  increment,
  arrayUnion,
  getDoc,
  arrayRemove,
  enableNetwork,
  disableNetwork,
 
   initializeFirestore, persistentLocalCache, persistentMultipleTabManager 

} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";



const firebaseConfig = {
  apiKey: "AIzaSyDvOLsG6Sk5PFuyGSh5aFFsHNLc9vqa8EE",
  authDomain: "test-96524.firebaseapp.com",
  projectId: "test-96524",
  storageBucket: "test-96524.firebasestorage.app",
  messagingSenderId: "571466546618",
  appId: "1:571466546618:web:c9e2648747c9acc721f183",
  measurementId: "G-HQBBZPM7LD",
};

const app = initializeApp(firebaseConfig);


const db = initializeFirestore( app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});




const auth = getAuth(app);



let currentUser = null;
let selectedCustomer = null;





// مصادقة المستخدم
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    showDashboard();
    loadCustomers();
  } else {
    showAuthSection();
    
  }
});

window.login = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
      await signInWithEmailAndPassword(auth, email, password);
      iziToast.success({ title: 'مرحبا بعودتك!' });
  } catch (error) {
      handleError(error);
  }
};


    // تسجيل جديد
    window.register = async () => {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      try {
          await createUserWithEmailAndPassword(auth, email, password);
          iziToast.success({ title: 'تم إنشاء الحساب بنجاح' });
      } catch (error) {
          handleError(error);
      }
  };




// تسجيل الخروج
window.logout = async () => {
  try {
      await signOut(auth);
      iziToast.info({ title: 'تم تسجيل الخروج' });
  } catch (error) {
      handleError(error);
  }
};


// إدارة الواجهة
function showDashboard() {
  document.getElementById('authSection').style.display = 'none';
  document.getElementById('dashboard').style.display = 'grid';
}









function showAuthSection() {
  document.getElementById('authSection').style.display = 'block';
  document.getElementById('dashboard').style.display = 'none';
}


/// إضافة زبون
window.addCustomer = async () => {
  const menu = document.getElementById("menu");
  if (menu) {
    menu.style.display = 'none';
  }

  // نافذة SweetAlert2 تحتوي على 4 مدخلات
  const { value: formValues } = await Swal.fire({
    title: 'إضافة زبون جديد',
    html:
      `<input id="customer-name" class="swal2-input" placeholder="اسم الزبون">` +
      `<input id="customer-phone" class="swal2-input" placeholder="رقم الهاتف (اختياري)">` +
      `<input id="customer-address" class="swal2-input" placeholder="العنوان (اختياري)">` +
      `<input id="customer-note" class="swal2-input" placeholder="ملاحظة (اختياري)">` +
      `<select id="customer-verification" class="swal2-input">
         <option value="">  بدون توثيق</option>
         <option value="blue">موثوق (أزرق)</option>
         <option value="silver">عادي (فضي)</option>
       </select>`,
    focusConfirm: false,
    showCancelButton: true,
    cancelButtonText: 'إلغاء',
    confirmButtonText: 'إضافة',
    customClass: {
      popup: 'swal-popup'
    },
    preConfirm: () => {
      const name = document.getElementById('customer-name').value.trim();
      const phone = document.getElementById('customer-phone').value.trim();
      const address = document.getElementById('customer-address').value.trim();
      const note = document.getElementById('customer-note').value.trim();
      const verification = document.getElementById('customer-verification').value;
      
      if (!name) {
        Swal.showValidationMessage('يرجى إدخال اسم الزبون!');
        return false;
      }
      
      return { name, phone, address, note, verification };
    }
  });

  if (!formValues) {
    Swal.fire('لم يتم إدخال بيانات الزبون');
    return;
  }

  try {
    // تأكد من أن currentUser معرف بشكل صحيح في مكان آخر في الكود
    if (!currentUser) {
      Swal.fire('لم يتم العثور على المستخدم الحالي');
      return;
    }

    // إضافة الزبون إلى قاعدة البيانات
    await addDoc(collection(db, "stores", currentUser.uid, "customers"), {
      verification: formValues.verification || '', // إضافة نوع التوثيق
      name: formValues.name,
      phone: formValues.phone || '',
      address: formValues.address || '',
      note: formValues.note || '',
      balance: 0,
      transactions: [],
      lastUsed: Date.now()
    });

    // إغلاق نافذة SweetAlert وإعادة تحميل البيانات
    loadCustomers();

    Swal.fire('تم إضافة الزبون بنجاح', '', 'success');
  } catch (error) {
    Swal.fire('خطأ في إضافة الزبون: ' + error.message, '', 'error');
  }
};















//////////////////////////////



window.loadCustomers = async () => {
  // 1. استعلام مع ترتيب حسب lastUsed تنازليًا
  const q = query(
    collection(db, "stores", currentUser.uid, "customers"),
    orderBy("lastUsed", "desc")
  );

  const querySnapshot = await getDocs(q);
  const customers = [];

  querySnapshot.forEach(doc => {
    const data = doc.data();
    customers.push({ id: doc.id, ...data });
  });

  // 2. تحديث واجهة المستخدم
  const list = document.getElementById('customersList');
  list.innerHTML = '';

  customers.forEach(data => {
    let verificationIcon = ''; // تعريف المتغير أولاً

    // تحديد أيقونة التوثيق بناءً على قيمة التوثيق
    if (data.verification === 'blue') {
      verificationIcon = '<img  src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Twitter_Verified_Badge.svg/2048px-Twitter_Verified_Badge.svg.png" alt=""  width="20px" height="20px">'; // توثيق أزرق
    } else if (data.verification === 'silver') {
      verificationIcon = '<img style="   background-color: #ffffff; border-radius: 10px;"   src="https://www.svgrepo.com/show/528774/verified-check.svg" alt=""  width="20px" height="20px">';  // توثيق فضي
    }

    const li = document.createElement('li');
    li.className = 'customer-item';
    li.innerHTML = `
          

      <div>
        <h4  style=" display: flex; align-items: center; gap: 5px; margin-top: 5px; "> <img src="https://www.svgrepo.com/show/331253/user.svg" alt=""  width="25px" height="25px"> ${data.name}${verificationIcon}  </h4> <!-- إضافة التوثيق هنا -->

        <p style="color:  ${data.balance >= 0 ? 'var(--text)' : 'var(--danger)'} ">
          ${data.balance} ليرة
        </p>
      </div>
      <div style="display: flex; gap: 5px; margin-top: 5px;">
        <button class="btn1" onclick="deleteCustomer('${data.id}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;

    // 3. تحديث lastUsed عند النقر على العنصر (وليس على الأزرار)
    li.addEventListener('click', async (e) => {
      if (e.target.closest('button')) return; // تجاهل إذا ضغط على زر (تعديل/حذف)

      // تحديث lastUsed
      await updateDoc(doc(db, "stores", currentUser.uid, "customers", data.id), {
        lastUsed: new Date()
      });

      showCustomerDetails(data.id, data);

      // إعادة تحميل القائمة
      document.getElementById('searchInput').value = '';
      loadCustomers();
      ashowCustomerDetails(data);
    });

    list.appendChild(li);
  });
};









//تعديل الزبون

window.editCustomer = async (customerId, currentData) => {
  const { value: formValues } = await Swal.fire({
    title: 'تعديل بيانات الزبون',
    html:
      `<input id="customer-name" class="swal2-input" placeholder="اسم الزبون" value="${currentData.name}">` +
      `<input id="customer-phone" class="swal2-input" placeholder="رقم الهاتف (اختياري)" value="${currentData.phone}">` +
      `<input id="customer-address" class="swal2-input" placeholder="العنوان (اختياري)" value="${currentData.address}">` +
      `<input id="customer-note" class="swal2-input" placeholder="ملاحظة (اختياري)" value="${currentData.note}">` +
      `<select id="customer-verification" class="swal2-input">
        <option value="">بدون توثيق</option>
        <option value="blue" ${currentData.verification === 'blue' ? 'selected' : ''}>موثوق (أزرق)</option>
        <option value="silver" ${currentData.verification === 'silver' ? 'selected' : ''}>عادي (فضي)</option>
      </select>`,
    focusConfirm: false,
    showCancelButton: true,
    cancelButtonText: 'إلغاء',
    confirmButtonText: 'تحديث',
    preConfirm: () => {
      const name = document.getElementById('customer-name').value.trim();
      const phone = document.getElementById('customer-phone').value.trim();
      const address = document.getElementById('customer-address').value.trim();
      const note = document.getElementById('customer-note').value.trim();
      const verification = document.getElementById('customer-verification').value; // الحصول على حالة التوثيق
      if (!name) {
        Swal.showValidationMessage('يرجى إدخال اسم الزبون!');
        return false;
      }
      return { name, phone, address, note, verification }; // إضافة التوثيق للبيانات المعادة
    }
  });

  if (!formValues) {
    return;
  }

  try {
    const customerRef = doc(db, "stores", currentUser.uid, "customers", customerId);
    await updateDoc(customerRef, {
      name: formValues.name,
      phone: formValues.phone,
      address: formValues.address,
      note: formValues.note,
      verification: formValues.verification || '', // تحديث التوثيق
      lastUsed: Date.now()
    });
    
    loadCustomers(); // إعادة تحميل القائمة
        Swal.fire('تم تحديث بيانات الزبون بنجاح', '', 'success');
  } catch (error) {
    Swal.fire('خطأ في تعديل البيانات: ' + error.message, '', 'error');
  }
};








//عدد الزبائن
document.addEventListener('DOMContentLoaded', () => {
  const targetNode = document.getElementById('customersList');
  if (!targetNode) return;  // التأكد من وجود العنصر

  const config = { childList: true, subtree: true };

  const observer = new MutationObserver(() => {
    document.getElementById('counter').textContent = document.querySelectorAll('#customersList li').length;
  });

  // بدء المراقبة
  observer.observe(targetNode, config);
});





//////////////////////////////////////
// مراقبة التغيرات داخل قائمة li
const targetNode = document.getElementById('customersList');
const config = { childList: true, subtree: true, characterData: true };

// إنشاء observer لمراقبة التغيرات
const observer = new MutationObserver(() => {
  const h4Elements = document.querySelectorAll('#customersList li p');

  let totalDebt = 0;      // مجموع المديونية (أكبر من صفر)
  let totalCredit = 0;    // مجموع الدائنين (أقل من صفر)

  h4Elements.forEach(p => {
    const value = parseFloat(p.textContent) || 0;

    if (value > 0) {
      totalDebt += value; // مديون
    } else if (value < 0) {
      totalCredit += value; // دائن (له دين)
    }
  });

  // عرض النتائج
  document.getElementById('totalDebt').textContent = totalDebt; // إجمالي المديونية
  document.getElementById('totalCredit').textContent = totalCredit; // إجمالي الدائنين
});

// بدء المراقبة
observer.observe(targetNode, config);

//////////////////////////////////////////////








//مديونين وغير مديونين

// مراقبة التغيرات داخل قائمة li
const targetNode1 = document.getElementById('customersList');
const config1 = { childList: true, subtree: true, characterData: true };

// إنشاء observer لمراقبة التغيرات
const observer1 = new MutationObserver(() => {
  const h4Elements = document.querySelectorAll('#customersList li p');
  let indebtedCount = 0;
  let nonIndebtedCount = 0;
  let creditorsCount = 0; // الزبائن الذين لهم دين (دائنين)

  h4Elements.forEach(p => {
    const value = parseFloat(p.textContent) || 0;
    if (value > 0) {
      indebtedCount++;
    } else if (value < 0) {
      creditorsCount++; // الزبائن الذين لهم دين
    } else {
      nonIndebtedCount++;
    }
  });

  // عرض النتائج
  document.getElementById('debtorsCount').textContent = indebtedCount;
  document.getElementById('nonDebtorsCount').textContent = nonIndebtedCount;
  document.getElementById('creditorsCount').textContent = creditorsCount;
});

// بدء المراقبة
observer1.observe(targetNode1, config1);














  // حذف زبون
  window.deleteCustomer = async (customerId) => {

        const customerRef = doc(db, "stores", currentUser.uid, "customers", customerId);
    const customerSnap = await getDoc(customerRef);
    const customerData = customerSnap.data();
    // الخطوة الأولى: تأكيد الحذف برسالة تحذيرية
    const confirmDelete = await Swal.fire({
      title: 'هل تريد حذف العميل؟' ,
      
      html: `       <h2 style="margin: 10px; color: red;">${customerData.name}</h2>
         <div style="display: flex; justify-content: center; align-items: center;">
         
                <lottie-player 
                    src="https://lottie.host/c8791956-98a4-490f-a9e1-b28d0fe18e12/u4QKY0nES6.json"
                    background="transparent"
                    speed="1"
                    style="width: 150px; height: 150px;"
                    loop
                    autoplay>
                </lottie-player>
            </div>
            
      `,
      showCancelButton: true,
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء'
    });
    
  
    if (!confirmDelete.isConfirmed) {
      Swal.fire('تم الإلغاء', 'لم يتم حذف الزبون', 'info');
      return;
    }
  
    // الخطوة الثانية: إدخال كلمة تأكيد
    const { value: confirmText } = await Swal.fire({
      title: 'تأكيد إضافي',
      input: 'text',
      inputLabel: 'اكتب "حذف" للتأكيد',
      inputPlaceholder: 'اكتب الكلمة هنا',
      showCancelButton: true,
      confirmButtonText: 'تأكيد',
      cancelButtonText: 'إلغاء',
      inputValidator: (value) => {
        if (value !== 'حذف') {
          return 'يجب كتابة كلمة "حذف" بشكل صحيح';
        }
      }
    });
  
    if (confirmText !== 'حذف') {
      Swal.fire('تم الإلغاء', 'لم يتم حذف الزبون', 'info');
      return;
    }
  
    // الخطوة الثالثة: تنفيذ عملية الحذف
    try {
      await deleteDoc(doc(db, "stores", currentUser.uid, "customers", customerId));
      loadCustomers();
      if (selectedCustomer === customerId) {
        closeCustomerDetails();
      }
      Swal.fire({
        title: 'تم حذف الزبون بنجاح',
        html: `
           <div style="display: flex; justify-content: center; align-items: center;">
                  <lottie-player 
                      src="https://lottie.host/dcbdd1b6-bd83-4d99-b7eb-49b1eb87dffb/VvU7vZezCw.json"
                      background="transparent"
                      speed="1"
                      style="width: 150px; height: 150px;"
                      autoplay>
                  </lottie-player>
              </div>
              
        `,
        confirmButtonText: 'تم',

      
      });



      
    } catch (error) {
      Swal.fire('خطأ', 'حدث خطأ أثناء الحذف: ' + error.message, 'error');
    }
  };




    // عرض تفاصيل الزبون
    async function showCustomerDetails(customerId, customerData) {
      selectedCustomer = customerId;
      document.getElementById('customerDetails').style.display = 'block';
      document.getElementById('balance').textContent = ("المجموع:")+customerData.balance ;
      
      loadTransactions(customerData.transactions);
      
  }


 
  





    // إضافة معاملة
// إضافة معاملة
window.addTransaction = async (type) => {
  const amount = parseFloat(document.getElementById('amountInput').value);
  if (isNaN(amount) || amount <= 0) {
    iziToast.warning({
      title: 'تحذير',
      message: 'ادخل مبلع صحيح'
    });

    return;
  }

  const customerRef = doc(db, "stores", currentUser.uid, "customers", selectedCustomer);
  const transaction = {
      type: type,
      amount: amount,
      date: new Date().toISOString()
  };

  try {
    // عرض رسالة الإشعار بناءً على نوع المعاملة
    const message = type === 'credit' 
      ? `تم إضافة: ${amount} ليرة` // إذا كانت إضافة دين
      : `تم خصم: ${amount} ليرة`; // إذا كانت خصم دين

    iziToast.info({
      title: type === 'credit' ? 'تم الإضافة' : 'تم الخصم',
      message: message
    });

    await updateDoc(customerRef, {
        balance: increment(type === 'credit' ? amount : -amount),
        transactions: arrayUnion(transaction)
    });

    document.getElementById('amountInput').value = ''; // إفراغ الـ input بعد المعاملة

    // تحديث الرصيد بعد جلب البيانات
    const customerSnap = await getDoc(customerRef);
    const customerData = customerSnap.data();

    document.getElementById('balance').textContent = ("المجموع:")+customerData.balance ;

    loadCustomers();
    loadTransactions(customerData.transactions);
  } catch (error) {
    alert('خطأ في إضافة المعاملة: ' + error.message);
  }
};







  // حذف جميع المعاملات
  window.deleteALLTransaction = async () => {
    const confirmation = await  Swal.fire({
      title: "هل انت متاكد من حذف جميع المعاملات ?",
      html: `
         <div style="display: flex; justify-content: center; align-items: center;">
                <lottie-player 
                    src="https://lottie.host/1eccb12a-f220-45e3-b382-76255c2e7e82/34O2VeUpdt.json"
                    background="transparent"
                    speed="1"
                    loop
                    style="width: 150px; height: 150px;"
                    autoplay>
                </lottie-player>
            </div>
            
      `,
      showCancelButton: true,
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء'
    });
  
    if (!confirmation.isConfirmed) {
      Swal.fire('تم الإلغاء', 'لم يتم حذف المعاملات', 'info');
      return;
    }
  
    const { value: userInput } = await Swal.fire({
      title: 'اكتب "حذف" للتأكيد',
      input: 'text',
      inputPlaceholder: 'اكتب حذف هنا',
      confirmButtonText: 'نعم',
      cancelButtonText: 'إلغاء',


      showCancelButton: true 
    });
  
    if (userInput !== 'حذف') {
      Swal.fire('إلغاء', 'الكلمة المدخلة غير صحيحة', 'error');
      return;
    }
  
    const customerRef = doc(db, "stores", currentUser.uid, "customers", selectedCustomer);
  
    try {
      const customerSnap = await getDoc(customerRef);
      const customerData = customerSnap.data();
  
      if (!customerData || !customerData.transactions || customerData.transactions.length === 0) {
        Swal.fire('لا توجد معاملات', 'لا توجد معاملات لهذا الزبون', 'info');
        return;
      }
  
      // تحديث الرصيد ليكون صفر وحذف المعاملات
      await updateDoc(customerRef, {
        balance: 0,
        transactions: []
      });
  
      document.getElementById('balance').textContent = "المجموع:0 " ;

      loadCustomers();
      loadTransactions([]);
  
      Swal.fire({
        title: "تم حذف جميع المعاملات بنجاح ",
        html: `
           <div style="display: flex; justify-content: center; align-items: center;">
                  <lottie-player 
                      src="https://lottie.host/16fcf0a4-7fd0-4534-9b1b-34e532d42281/yIAr0oWkuR.json"
                      background="transparent"
                      speed="3"
                      style="width: 150px; height: 150px;"
                      autoplay>
                  </lottie-player>
              </div>
              
        `,
        confirmButtonText: "تم",
      });
    } catch (error) {
      Swal.fire('خطأ', 'حدث خطأ أثناء الحذف: ' + error.message, 'error');
    }
  };
  
  
////////


  

  // تحميل المعاملات
  async function loadTransactions(transactions) {
    document.getElementById("menu").style.display = 'none';
      const list = document.getElementById('transactionsList');
      list.innerHTML = '';
      
      transactions.reverse().forEach((transaction, index) => {
          const li = document.createElement('li');
          li.className = 'transaction-item ';
          li.innerHTML = `
          
              <div>
                  <span style="color: ${transaction.type === 'credit' ? 'var(--text)' : 'var(--danger)'}">
                      ${transaction.type === 'credit' ? '+' : '-'}${transaction.amount} ليرة
                  </span>
                  <small style="color: var(--text)">${new Date(transaction.date).toLocaleString('ar', { 
  year: 'numeric', 
  month: '2-digit', 
  day: '2-digit', 
  hour: '2-digit', 
  minute: '2-digit', 
})}</small>

              </div>
              <div>
                  <button class="btn1 btn-danger" onclick="deleteTransaction(${index})">
                      <i class="fas fa-trash"></i>
                  </button>
              </div>
          `;
          list.appendChild(li);
          

      });
  }






  // حذف معاملة
  window.deleteTransaction = async (index) => {
    document.getElementById("menu").style.display = 'none';

    const confirmDelete = await Swal.fire({
      title: 'تأكيد الحذف',
      text: 'هل تريد حذف هذه المعاملة؟',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء'
    });
  
    if (!confirmDelete.isConfirmed) {
      Swal.fire('تم الإلغاء', 'لم يتم حذف المعاملة', 'info');
      return;
    }
  
    const customerRef = doc(db, "stores", currentUser.uid, "customers", selectedCustomer);
    const customerSnap = await getDoc(customerRef);
    const transactions = customerSnap.data().transactions;
    const reversedIndex = transactions.length - 1 - index;
    const transaction = transactions[reversedIndex];
  
    try {
      // تحديث الرصيد بشكل عكسي بناءً على نوع المعاملة
      await updateDoc(customerRef, {
        balance: increment(transaction.type === 'credit' ? -transaction.amount : transaction.amount),
        transactions: arrayRemove(transaction)
      });
  
      // جلب البيانات بعد التحديث
      const updatedSnap = await getDoc(customerRef);
      const updatedData = updatedSnap.data();
      document.getElementById('balance').textContent = "المجموع: " + updatedData.balance;
  
      loadTransactions(updatedData.transactions);
      loadCustomers();
  
      Swal.fire('نجاح', 'تم حذف المعاملة بنجاح', 'success');
  
    } catch (error) {
      Swal.fire('خطأ', 'حدث خطأ أثناء الحذف: ' + error.message, 'error');
    }
  };
  






   // إدارة الواجهة




window.showAddCustomerModal = () => {
    document.getElementById('addCustomerModal').style.display = 'flex';
}

window.closeAddCustomerModal = () => {
    document.getElementById('addCustomerModal').style.display = 'none';
    document.getElementById('newCustomerName').value = '';
}


 // دعم زر Enter
 window.handleEnter = (e) => {
  if (e.key === 'Enter') addTransaction('credit');
};


    // إعدادات iziToast العامة
    iziToast.settings({
      timeout: 5000, // مدة عرض الإشعار
      resetOnHover: true, // إعادة ضبط المؤقت عند التحويم
      position: 'topLeft', // موضع الإشعار
      transitionIn: 'bounceInDown', // تأثير الدخول
      transitionOut: 'fadeOut' // تأثير الخروج
    });




 
