/* Nujoomi: installable family app. Parents sign in with email; each child's device is linked once with a code from the parent. */
import {initializeApp} from 'firebase/app';
import {getAuth,connectAuthEmulator,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendPasswordResetEmail,signInAnonymously,signOut,setPersistence,indexedDBLocalPersistence} from 'firebase/auth';
import {initializeFirestore,persistentLocalCache,persistentMultipleTabManager,connectFirestoreEmulator,doc,getDoc,setDoc,updateDoc,deleteDoc,onSnapshot,collection,query,where,writeBatch,increment,serverTimestamp,Timestamp,addDoc,deleteField} from 'firebase/firestore';

const EMU=new URLSearchParams(location.search).has('emu');
const CFG=EMU?{apiKey:'demo-key',authDomain:'localhost',projectId:'demo-najmati',appId:'demo'}:window.FIREBASE_CONFIG;
let fbApp=null,auth=null,db=null;
if(CFG){
  fbApp=initializeApp(CFG);
  auth=getAuth(fbApp);
  db=initializeFirestore(fbApp,EMU?{ignoreUndefinedProperties:true}:{ignoreUndefinedProperties:true,localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})});
  if(EMU){connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});connectFirestoreEmulator(db,'127.0.0.1',8080)}
}

/* ---------- icons ---------- */
const P={
  star:'<path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"/>',
  sunrise:'<path d="M3 19h18M6.5 19a5.5 5.5 0 0 1 11 0M12 3v5M9 5.5L12 3l3 2.5M4.2 11.5l1.6 1.2M19.8 11.5l-1.6 1.2"/>',
  sun:'<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  cloudsun:'<path d="M9 4v1.5M4 9H5.5M5.6 5.6l1 1M15.6 8.3A4 4 0 0 0 8 9.5"/><path d="M7.5 20a3.5 3.5 0 0 1-.3-7A5 5 0 0 1 17 12.5a3.8 3.8 0 0 1 .5 7.5z"/>',
  sunset:'<path d="M3 17h18M6.5 17a5.5 5.5 0 0 1 11 0M12 3v6M9 6.5L12 9l3-2.5M5 21h14"/>',
  moon:'<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 6.8 6.8 0 0 0 20 14.5z"/>',
  mosque:'<path d="M5 21v-7a7 7 0 0 1 14 0v7M3 21h18M12 3v4M10 21v-4a2 2 0 0 1 4 0v4"/>',
  book:'<path d="M4 19V5a2 2 0 0 1 2-2h14v14H6a2 2 0 0 0-2 2 2 2 0 0 0 2 2h14M8 7h8M8 11h5"/>',
  math:'<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7 8.5h4M9 6.5v4M13.5 8.5h4M7 15.5h4M13.8 13.5l3.4 4M17.2 13.5l-3.4 4"/>',
  sparkle:'<path d="M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  bed:'<path d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7" cy="11.5" r="1.8"/>',
  toys:'<rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5"/><rect x="13" y="13" width="7.5" height="7.5" rx="1.5"/><path d="M12 3.5l4 6.5H8z"/>',
  plate:'<circle cx="13" cy="12" r="7"/><circle cx="13" cy="12" r="3.5"/><path d="M3 4v5a1.5 1.5 0 0 0 3 0V4M4.5 9v11"/>',
  gift:'<rect x="3.5" y="9" width="17" height="11.5" rx="2"/><path d="M2.5 9h19M12 9v11.5M12 9C10 4 6 4.5 7 7.5c.4 1.2 2.6 1.5 5 1.5M12 9c2-5 6-4.5 5-1.5-.4 1.2-2.6 1.5-5 1.5"/>',
  game:'<path d="M7 7h10a5 5 0 0 1 4 8l-1 2a2 2 0 0 1-3 .5L15 16H9l-2 1.5a2 2 0 0 1-3-.5l-1-2a5 5 0 0 1 4-8z"/><path d="M8 10v3M6.5 11.5h3M15.5 10.5h.01M17.5 12.5h.01"/>',
  tree:'<path d="M12 3l6 8h-3.5l4.5 6H5l4.5-6H6zM12 17v4"/>',
  ice:'<path d="M7.5 10.5a4.5 4.5 0 1 1 9 0M7 10.5h10L12 21z"/>',
  pizza:'<path d="M12 21L3.5 5.5c5.5-3 11.5-3 17 0z"/><path d="M5.5 9c4-2 9-2 13 0"/><circle cx="10" cy="12" r=".6"/><circle cx="14" cy="14" r=".6"/><circle cx="12" cy="17" r=".6"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  hourglass:'<path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9s10 4 10 9"/>',
  list:'<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
  bell:'<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 21h4"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  retry:'<path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4.5h4.5"/>',
  camera:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  pin:'<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  heart:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  ball:'<circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 4.5h-5L8 10zM12 3v4M16 10l4.5-1.5M14.5 14.5l2.5 4M9.5 14.5L7 18.5M8 10L3.5 8.5"/>',
  drop:'<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  palette:'<path d="M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/>',
  tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
  play:'<path d="M7 4.5v15l12-7.5z"/>',
  upload:'<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  speaker:'<path d="M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>'
};
const I=(n,cls='')=>`<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n]||P.star}</svg>`;
const T={
 ar:{brand:'نجومي',roleKid:'واجهة الطفل',roleParent:'واجهة الوالدين',note:'نموذج أولي للتجربة: البيانات أمثلة وتُحفظ في هذا الجهاز فقط.',reset:'إعادة الأمثلة',
  p_royal:'السماء',p_royal_d:'شمس وسحب وبالونات',p_web:'بطل الشبكة',p_web_d:'مدينة وشبكات عنكبوت',p_sea:'قاع البحر',p_sea_d:'أسماك وفقاعات وأعشاب',p_speed:'السرعة الخارقة',p_speed_d:'حلقات ذهبية وتلال مربعات',p_blocks:'عالم المكعبات',p_blocks_d:'مكعبات طائرة وأرض بكسل',p_violet:'بنفسجي',p_violet_d:'بنفسجي وأصفر',p_teal:'فيروزي',p_teal_d:'فيروزي وبرتقالي',p_pink:'وردي',p_pink_d:'وردي وذهبي',
  colors:'ثيم التطبيق',dayMode:'الوضع النهاري',nightMode:'الوضع الليلي',langBtn:'EN',langTitle:'English',
  prayer:'الصلاة',study:'المذاكرة',home:'ترتيب البيت',
  pending:'بانتظار الموافقة',approved:'تم',rejected:'حاول مرة أخرى',
  swap:'بدّل نجومك بمكافأة',canNow:'تقدر تطلبها الآن',left:n=>`باقي ${n} نجمة`,
  hi:n=>`أهلاً ${n}`,heroP:'أنجز مهامك واجمع النجوم. كل مهمة يعتمدها أحد الوالدين تُضاف لرصيدك.',stars:'نجمة',
  doneOf:(d,n)=>`أنجزت ${d} من ${n} مهام اليوم`,todayTasks:'مهام اليوم',rewards:'المكافآت',
  todayOf:(d,n)=>`اليوم: ${d} من ${n}`,waiting:n=>`طلبات بانتظار اعتمادك (${n})`,
  rewardReq:c=>`طلب مكافأة بـ ${c} نجمة`,saysDone:(t,p,f)=>`${f?'تقول إنها أنجزتها':'يقول إنه أنجزها'} الساعة ${t} · ${p}+ نجمة`,
  approve:'اعتماد',reject:'رفض',noReq:'لا توجد طلبات الآن. أحسنتم جميعاً!',
  addTask:'إضافة مهمة جديدة',fTitle:'اسم المهمة',fPh:'مثال: ترتيب الحقيبة المدرسية',fCat:'النوع',fTime:'الوقت',fPts:'النجوم',fDays:'الأيام',fKids:'لمن؟',addBtn:'إضافة المهمة',
  schedule:'المهام الأخرى (المذاكرة والبيت)',thTask:'المهمة',thTime:'الوقت',thDays:'الأيام',thWho:'لمن',thPts:'نجوم',del:'حذف',daily:'يومياً',sep:'، ',
  requests:'الطلبات',tasksTab:'المهام والجدولة',
  resetDone:'رجعت الأمثلة',withParent:'طلبك عند ماما أو بابا',alreadyOk:'هذه المهمة معتمدة',
  ask:t=>`هل أنجزت «${t}»؟`,askP:p=>`سنرسلها لأحد الوالدين للاعتماد، وبعدها تحصل على ${p} نجمة.`,yes:'نعم، أنجزتها!',notYet:'ليس بعد',sent:'أُرسلت للاعتماد',
  need:n=>`تحتاج ${n} نجمة إضافية`,rewardSent:'أُرسل طلب المكافأة',okFor:n=>`اعتُمد لـ ${n}`,rejected_t:'رُفض الطلب',deleted:'حُذفت المهمة',
  pickOne:'اختر يوماً وطفلاً واحداً على الأقل',added:'أُضيفت المهمة إلى الجدول',am:'ص',pm:'م',adhanTitle:'تنبيه الأذان',adhanFor:'التنبيه لصلاة',soundLbl:'صوت التنبيه',chime:'نغمة هادئة',customSnd:'صوت مخصص',uploadSnd:'رفع ملف صوتي',testSnd:'تجربة الصوت',adhanNow:p=>`حان الآن وقت صلاة ${p}`,adhanSub:'حيّ على الصلاة',adhanOk:'حاضر، سأصلي',stopSnd:'إيقاف الصوت',sndSaved:'حُفظ الصوت',playing:'يتم تشغيل الصوت',adhanNote:'في هذا النموذج يعمل التنبيه والصفحة مفتوحة. في التطبيق الفعلي يصل كإشعار بصوت الأذان حتى لو كان الجهاز مقفلاً.',nTasks:n=>n===0?'بدون مهام':n===1?'مهمة واحدة':n===2?'مهمتان':n<=10?n+' مهام':n+' مهمة',types:'أنواع المهام',presets:'اقتراحات سريعة (اضغط للإضافة)',newType:'اسم النوع الجديد',typePh:'مثال: الرياضة',icon:'الأيقونة',color:'اللون',addType:'إضافة النوع',typeAdded:'أُضيف النوع',typeDeleted:'حُذف النوع',typeInUse:n=>`لا يمكن حذفه لأن فيه ${L('nTasks',n)}، احذفها أولاً`,taskCount:n=>L('nTasks',n),typesNote:'يمكنك إضافة أي عدد من الأنواع، وكل نوع يظهر عند الطفل في قسم مستقل بلونه. الصلاة نوع ثابت.',allKids:'الكل',forAll:'ستُضاف المهمة مرة واحدة لجميع الأبناء، ويسجّلها كل طفل بنفسه.',forSome:n=>`ستُضاف المهمة لـ: ${n}`,fixedNote:'الصلوات الخمس ثابتة وتنزل تلقائياً كل يوم لجميع الأبناء حسب مواقيت المدينة المختارة، ولا تحتاج إضافتها.',approveAll:'اعتماد الكل',noReqKid:'لا توجد طلبات',wow:'أحسنت! تمّت المهمة',locked:'لم يحن وقتها',startsIn:d=>`تبدأ بعد ${d}`,nowLbl:'حان وقتها',leftNow:d=>`باقي على خروج الوقت ${d}`,missed:'فاتت',notYetTime:d=>`لم يحن وقت الصلاة بعد، باقي ${d}`,missedT:'فات وقت هذه الصلاة، لا يمكن تسجيلها',location:'الموقع ومواقيت الصلاة',country:'الدولة',city:'المدينة',methodNote:'تُحسب المواقيت تلقائياً كل يوم حسب طريقة الحساب المعتمدة في الدولة. يمكن تسجيل الصلاة من دخول وقتها حتى دخول الصلاة التالية (الفجر حتى الشروق، والعشاء حتى منتصف الليل).',pn_fajr:'الفجر',pn_dhuhr:'الظهر',pn_asr:'العصر',pn_maghrib:'المغرب',pn_isha:'العشاء',missedCount:(n,f)=>`${f?'فاتتها':'فاتته'} ${n===1?'صلاة واحدة':n===2?'صلاتان':n+' صلوات'}`,simTime:'تجربة الوقت',nowBtn:'الآن',changePhoto:'تغيير الصورة',removePhoto:'إزالة الصورة',photoSaved:'حُفظت الصورة',
  days:['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت']},
 en:{brand:'Nujoomi',roleKid:'Kid view',roleParent:'Parent view',note:'Prototype for testing: sample data, saved on this device only.',reset:'Reset samples',
  p_royal:'Sky',p_royal_d:'Sun, clouds and balloons',p_web:'Web Hero',p_web_d:'City and spider webs',p_sea:'Under the Sea',p_sea_d:'Fish, bubbles and seaweed',p_speed:'Super Speed',p_speed_d:'Gold rings and checkered hills',p_blocks:'Block World',p_blocks_d:'Floating cubes and pixel ground',p_violet:'Violet',p_violet_d:'Violet and yellow',p_teal:'Teal',p_teal_d:'Teal and orange',p_pink:'Pink',p_pink_d:'Pink and gold',
  colors:'App theme',dayMode:'Day mode',nightMode:'Night mode',langBtn:'ع',langTitle:'العربية',
  prayer:'Prayer',study:'Study',home:'Home chores',
  pending:'Waiting for approval',approved:'Done',rejected:'Try again',
  swap:'Swap your stars for a reward',canNow:'You can ask for it now',left:n=>`${n} more stars`,
  hi:n=>`Hi ${n}`,heroP:'Finish your tasks and collect stars. Every task a parent approves goes to your balance.',stars:'stars',
  doneOf:(d,n)=>`${d} of ${n} tasks done today`,todayTasks:"Today's tasks",rewards:'Rewards',
  todayOf:(d,n)=>`Today: ${d} of ${n}`,waiting:n=>`Waiting for your approval (${n})`,
  rewardReq:c=>`Reward request for ${c} stars`,saysDone:(t,p)=>`Says it was done at ${t} · +${p} stars`,
  approve:'Approve',reject:'Reject',noReq:'No requests right now. Well done, everyone!',
  addTask:'Add a new task',fTitle:'Task name',fPh:'e.g. Pack the school bag',fCat:'Type',fTime:'Time',fPts:'Stars',fDays:'Days',fKids:'For whom?',addBtn:'Add task',
  schedule:'Other tasks (study and home)',thTask:'Task',thTime:'Time',thDays:'Days',thWho:'For',thPts:'Stars',del:'Delete',daily:'Daily',sep:', ',
  requests:'Requests',tasksTab:'Tasks & schedule',
  resetDone:'Samples restored',withParent:'Mom or Dad has your request',alreadyOk:'This task is approved',
  ask:t=>`Did you finish “${t}”?`,askP:p=>`We'll send it to a parent to approve, then you get ${p} stars.`,yes:'Yes, I did it!',notYet:'Not yet',sent:'Sent for approval',
  need:n=>`You need ${n} more stars`,rewardSent:'Reward request sent',okFor:n=>`Approved for ${n}`,rejected_t:'Request rejected',deleted:'Task deleted',
  pickOne:'Pick at least one day and one child',added:'Task added to the schedule',am:'AM',pm:'PM',adhanTitle:'Adhan alert',adhanFor:'Alert for',soundLbl:'Alert sound',chime:'Gentle chime',customSnd:'Custom sound',uploadSnd:'Upload sound',testSnd:'Test sound',adhanNow:p=>`It is time for ${p} prayer`,adhanSub:'Come to prayer',adhanOk:'OK, I will pray',stopSnd:'Stop sound',sndSaved:'Sound saved',playing:'Playing sound',adhanNote:'In this prototype the alert works while the page is open. In the real app it arrives as a notification with the adhan sound, even when the device is locked.',types:'Task types',presets:'Quick picks (tap to add)',newType:'New type name',typePh:'e.g. Sports',icon:'Icon',color:'Color',addType:'Add type',typeAdded:'Type added',typeDeleted:'Type deleted',typeInUse:n=>`Can't delete: it has ${n} task${n>1?'s':''}. Delete them first`,taskCount:n=>`${n} task${n===1?'':'s'}`,typesNote:'Add as many types as you like; each shows as its own colored section for the child. Prayer is fixed.',allKids:'All',forAll:'The task is added once for all children; each child logs it on their own.',forSome:n=>`The task will be added for: ${n}`,fixedNote:'The five daily prayers are fixed and appear automatically every day for all children, timed to the selected city. No need to add them.',approveAll:'Approve all',noReqKid:'No requests',wow:'Great job! Done',locked:'Not yet',startsIn:d=>`Starts in ${d}`,nowLbl:"It's time",leftNow:d=>`${d} left`,missed:'Missed',notYetTime:d=>`Prayer time hasn't started yet, ${d} to go`,missedT:'This prayer time has passed and can no longer be logged',location:'Location & prayer times',country:'Country',city:'City',methodNote:'Times are calculated every day using the official method for the country. A prayer can be logged from its start until the next prayer (Fajr until sunrise, Isha until midnight).',pn_fajr:'Fajr',pn_dhuhr:'Dhuhr',pn_asr:'Asr',pn_maghrib:'Maghrib',pn_isha:'Isha',missedCount:n=>`Missed ${n} prayer${n>1?'s':''}`,simTime:'Try a time',nowBtn:'Now',changePhoto:'Change photo',removePhoto:'Remove photo',photoSaved:'Photo saved',
  days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat']}
};
Object.assign(P,{
  logout:'<path d="M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5M10 16l-4-4 4-4M6 12h10"/>',
  link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 13.5a6.5 6.5 0 0 1 3.5 6.5"/>',
  tablet:'<rect x="4" y="2.5" width="16" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  key:'<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M14.5 8.5l2 2"/>',
  share:'<path d="M12 15V3M8 7l4-4 4 4M5 11v9h14v-9"/>',
  save:'<path d="M5 3h11l3 3v15H5zM8 3v6h7V3M8 21v-7h8v7"/>',
  back:'<path d="M15 5l-7 7 7 7"/>',
  trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5v1.5A3.5 3.5 0 0 0 8 11M16 6h3.5v1.5A3.5 3.5 0 0 1 16 11M12 13v4M8.5 21h7M9.5 17h5v4h-5z"/>',
  clipboard:'<rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9 4V3h6v1M9 11l2 2 4-4M9 17h6"/>',
  warn:'<path d="M12 3.5L2.5 20h19zM12 10v4.5M12 17.5h.01"/>',
  minus:'<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
  tv:'<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M8 21h8M9 2.5l3 3.5 3-3.5"/>',
  bike:'<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-7h5l3 7M10 9L8.5 6H6.5M15 9l-3 7"/>',
  cake:'<path d="M4 21V13h16v8M3 21h18M4 16c2 1.5 4 1.5 5.3 0 1.4 1.5 3.6 1.5 5.4 0 1.3 1.5 3.3 1.5 5.3 0M12 13V9M12 4.5c1 1 1 2 0 3-1-1-1-2 0-3"/>',
  cash:'<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.8"/><path d="M6 9.5v5M18 9.5v5"/>'
});
Object.assign(T.ar,{brand:'نجومي',note:'',
  welcome:'أهلاً بكم في نجومي',welcomeP:'تطبيق الأسرة لمتابعة الصلاة والمذاكرة ومهام البيت، وكسب النجوم.',
  iAmParent:'أنا ولي الأمر',iAmParentP:'إنشاء حساب الأسرة أو الدخول إليه',iAmKid:'هذا جهاز طفل',iAmKidP:'ربط هذا الجهاز بأحد الأبناء برمز من ولي الأمر',
  login:'تسجيل الدخول',signup:'حساب جديد',email:'البريد الإلكتروني',password:'كلمة المرور',pwHint:'6 أحرف على الأقل',forgot:'نسيت كلمة المرور؟',
  resetSent:'أرسلنا رابط إعادة التعيين إلى بريدك',enterEmail:'اكتب بريدك الإلكتروني أولاً',back:'رجوع',
  linkTitle:'ربط جهاز الطفل',linkP:'اطلب من ولي الأمر رمز الربط من واجهة الوالدين ← الأبناء والأجهزة، ثم اكتبه هنا.',codeLbl:'رمز الربط',linkBtn:'ربط الجهاز',
  badCode:'الرمز غير صحيح أو انتهت صلاحيته',linked:n=>`تم ربط الجهاز بـ ${n}`,
  pinTitle:n=>`أهلاً ${n}، اكتب رمزك السري`,wrongPin:'الرمز غير صحيح، حاول مرة أخرى',
  family:'الأبناء والأجهزة',kidName:'الاسم',kidNameEn:'الاسم بالإنجليزي',enAuto:'يُكتب تلقائياً، ويمكنك تعديله',look:'الشخصية',lk_boy:'ولد',lk_boy2:'ولد بقبعة',lk_girl:'بنت',
  pin:'الرمز السري (اختياري)',pinPh:'4 أرقام',saveBtn:'حفظ',saved:'تم الحفظ',devices:'الأجهزة المرتبطة',noDevices:'لا يوجد جهاز مرتبط بعد',
  linkDev:'ربط جهاز',unlink:'إلغاء الربط',unlinked:'أُلغي ربط الجهاز',codeFor:n=>`رمز ربط جهاز ${n}`,
  codeSteps:'على جهاز الطفل: افتح تطبيق نجومي، اختر «هذا جهاز طفل»، ثم اكتب هذا الرمز. الرمز صالح لمدة 30 دقيقة.',close:'إغلاق',
  addKid:'إضافة طفل',kidAdded:'أُضيف الطفل',delKid:'حذف الطفل',delKidQ:n=>`حذف ${n} وكل مهامه من الأسرة؟`,delKidOk:'نعم، احذف',kidDeleted:'حُذف الطفل',
  account:'الحساب',logout:'تسجيل الخروج',loggedAs:e=>`مسجّل الدخول بـ ${e}`,sharedLogin:'يمكن للوالدين الدخول بنفس الحساب من جوالين مختلفين.',
  err:'حدث خطأ، تأكد من الاتصال بالإنترنت وحاول مرة أخرى',errAuth:'البريد أو كلمة المرور غير صحيحة',errInUse:'هذا البريد مسجّل من قبل، اختر «تسجيل الدخول»',errWeak:'كلمة المرور قصيرة، 6 أحرف على الأقل',errEmail:'البريد الإلكتروني غير صحيح',
  loading:'جارٍ التحميل…',setupTitle:'التطبيق قيد الإعداد',setupP:'لم يُربط التطبيق بخادم البيانات بعد.',
  installIos:'لتثبيت التطبيق: اضغط زر المشاركة في سفاري ثم «إضافة إلى الشاشة الرئيسية».',installBtn:'تثبيت التطبيق',
  offline:'لا يوجد اتصال، سيتم حفظ التغييرات وإرسالها عند عودة الإنترنت',
  gender:'الجنس',boyLbl:'ولد',girlLbl:'بنت',doneShort:(d,n)=>`أنجزت ${d} من ${n}`,canCount:n=>n?`تقدر تطلب ${n}`:'اجمع النجوم',
  qadaNow:'اقضِها الآن',qadaLock:'مقفلة حتى القضاء',qadaHint:f=>f?'فاتتكِ، صلّيها قضاءً ثم اضغطي':'فاتتك، صلّها قضاءً ثم اضغط',qadaFirst:(p,f)=>`اقضِ${f?'ي':''} صلاة ${p} أولًا`,qadaAsk:(p,f)=>`هل قضيت${f?'ِ':''} صلاة ${p}؟`,qadaP:f=>f?'فاتكِ وقتها، فصلّيها الآن قضاءً. القضاء بلا نجمة، لكن يفتح لكِ الصلاة التالية.':'فاتك وقتها، فصلّها الآن قضاءً. القضاء بلا نجمة، لكن يفتح لك الصلاة التالية.',qadaYes:f=>f?'نعم، قضيتُ الصلاة':'نعم، قضيتُ الصلاة',qadaSent:'سُجّل القضاء، وفُتحت الصلاة التالية',qadaPend:'قضاء، بانتظار الموافقة',qadaDone:'قُضيت',qadaReq:(t,f)=>`${f?'تقول إنها قضت':'يقول إنه قضى'} الصلاة · ${t} · بلا نجمة`,
  penalties:'مكافأة وعقوبة',penTab:'خصم نجوم',bonTab:'نجوم إضافية',bonNew:'نجوم إضافية (مكافأة)',bonP:'كافئ الطفل على عمل استثنائي خارج المهام، مثل درجات ممتازة أو تصرف جميل. تُضاف النجوم لرصيده ويرى سببها في يومه.',bonReason:'سبب المكافأة',bonPh:'مثال: حصل على درجة ممتازة',bonPts:'عدد النجوم المضافة',bonBtn:'إضافة النجوم',bonDone:n=>`أُضيفت النجوم إلى ${n}`,bonUndone:'أُلغيت المكافأة وسُحبت النجوم',bonKid:n=>`أُضيف لك ${n} ${n===1?'نجمة':n===2?'نجمتان':n<=10?'نجوم':'نجمة'} مكافأة`,penNew:'خصم نجوم (عقوبة)',penP:'اختر الطفل، واكتب السبب، وحدد عدد النجوم. يظهر الخصم وسببه للطفل في يومه.',penWho:'على من؟',penReason:'سبب العقوبة',penPh:'مثال: الشجار مع الإخوة',penQuick:'أسباب شائعة (اضغط للاختيار)',penPts:'عدد النجوم المخصومة',penBtn:'خصم النجوم',penHist:'السجل',penNone:'السجل فارغ حتى الآن.',penUndo:'تراجع وإرجاع النجوم',penDone:n=>`خُصمت النجوم من ${n}`,penUndone:'أُلغيت العقوبة وأُرجعت النجوم',penPick:'اختر طفلاً واحداً على الأقل',penKid:n=>`خُصم منك ${n} ${n===1?'نجمة':n===2?'نجمتان':n<=10?'نجوم':'نجمة'}`,
  rewardsMgr:'إدارة المكافآت',rewardsP:'ضع المكافآت التي تناسبكم وسعر كل واحدة بالنجوم. تظهر للأبناء كما وضعتها بالضبط.',rewName:'اسم المكافأة',rewPh:'مثال: ساعة ألعاب إلكترونية',rewCost:'السعر بالنجوم',addReward:'إضافة المكافأة',rewAdded:'أُضيفت المكافأة',rewPhoto:'صورة المكافأة',rewUseIcon:'استخدام الأيقونة بدل الصورة',rewPhotoOpt:'صورة المكافأة (اختياري)',rewAddPhoto:'إضافة صورة',rewPhotoHint:'صوّر المنتج أو المكان الذي يحبه الأبناء، وستظهر الصورة بدل الأيقونة.',rewDeleted:'حُذفت المكافأة',noRewardsP:'لا توجد مكافآت بعد. أضف أول مكافأة من الأسفل.',noRewards:'لم يضع الوالدان مكافآت بعد.',
  sndBig:'الملف كبير، اختر مقطعاً أقصر (أقل من 700 كيلوبايت تقريباً، أي نصف دقيقة)',sndSaving:'جارٍ رفع الصوت إلى أجهزة الأبناء…',sndSaved:'حُفظ الصوت وسيصل لأجهزة الأبناء',
  adhanNote:'يؤذن على كل جهاز فتح فيه التطبيق (الأبناء وولي الأمر) بالصوت الذي اخترته. إذا فُتح التطبيق خلال 15 دقيقة من دخول الوقت يؤذن فوراً. لا يعمل والجهاز مقفل أو التطبيق مغلق تماماً.',playAdhan:'تشغيل الأذان'
});
Object.assign(T.en,{brand:'Nujoomi',note:'',
  welcome:'Welcome to Nujoomi',welcomeP:'The family app for prayer, study and home chores, with stars to earn.',
  iAmParent:"I'm a parent",iAmParentP:'Create or open the family account',iAmKid:"This is a child's device",iAmKidP:'Link this device to a child with a code from a parent',
  login:'Sign in',signup:'New account',email:'Email',password:'Password',pwHint:'At least 6 characters',forgot:'Forgot password?',
  resetSent:'We sent a reset link to your email',enterEmail:'Type your email first',back:'Back',
  linkTitle:"Link a child's device",linkP:'Ask a parent for the link code from Parent view → Kids & devices, then type it here.',codeLbl:'Link code',linkBtn:'Link device',
  badCode:'The code is wrong or has expired',linked:n=>`Device linked to ${n}`,
  pinTitle:n=>`Hi ${n}, type your secret code`,wrongPin:'Wrong code, try again',
  family:'Kids & devices',kidName:'Name',kidNameEn:'Name in English',enAuto:'Filled in for you; you can edit it',look:'Character',lk_boy:'Boy',lk_boy2:'Boy with cap',lk_girl:'Girl',
  pin:'Secret code (optional)',pinPh:'4 digits',saveBtn:'Save',saved:'Saved',devices:'Linked devices',noDevices:'No device linked yet',
  linkDev:'Link a device',unlink:'Unlink',unlinked:'Device unlinked',codeFor:n=>`Link code for ${n}'s device`,
  codeSteps:"On the child's device: open Nujoomi, choose “This is a child's device”, then type this code. It works for 30 minutes.",close:'Close',
  addKid:'Add a child',kidAdded:'Child added',delKid:'Remove child',delKidQ:n=>`Remove ${n} and their tasks from the family?`,delKidOk:'Yes, remove',kidDeleted:'Child removed',
  account:'Account',logout:'Sign out',loggedAs:e=>`Signed in as ${e}`,sharedLogin:'Both parents can sign in with the same account on their own phones.',
  err:'Something went wrong. Check the internet connection and try again',errAuth:'Wrong email or password',errInUse:'This email already has an account, choose “Sign in”',errWeak:'Password is too short, at least 6 characters',errEmail:'That email address is not valid',
  loading:'Loading…',setupTitle:'App is being set up',setupP:'The app is not connected to its data server yet.',
  installIos:'To install: tap the Share button in Safari, then “Add to Home Screen”.',installBtn:'Install app',
  offline:'No connection. Changes are saved and sent when the internet is back',
  gender:'Gender',boyLbl:'Boy',girlLbl:'Girl',doneShort:(d,n)=>`${d} of ${n} done`,canCount:n=>n?`${n} you can get`:'Collect stars',
  qadaNow:'Make it up now',qadaLock:'Locked until make-up',qadaHint:()=>'Missed: pray it now as qada, then tap',qadaFirst:p=>`Make up ${p} first`,qadaAsk:p=>`Did you make up ${p}?`,qadaP:()=>'Its time has passed, so pray it now as a make-up (qada). A make-up earns no star, but it opens the next prayer.',qadaYes:()=>'Yes, I made it up',qadaSent:'Make-up logged; the next prayer is open',qadaPend:'Make-up, waiting for approval',qadaDone:'Made up',qadaReq:t=>`Says they made up the prayer · ${t} · no star`,
  penalties:'Bonus & penalty',penTab:'Deduct stars',bonTab:'Bonus stars',bonNew:'Bonus stars (reward)',bonP:'Reward the child for something special outside the tasks, like great marks or lovely behaviour. The stars go to their jar and they see the reason on their day.',bonReason:'Reason for the bonus',bonPh:'e.g. Great test marks',bonPts:'Stars to add',bonBtn:'Add stars',bonDone:n=>`Stars added for ${n}`,bonUndone:'Bonus undone, stars taken back',bonKid:n=>`${n} bonus star${n>1?'s':''} for you`,penNew:'Deduct stars (penalty)',penP:'Pick the child, write the reason and the number of stars. The child sees the deduction and the reason on their day.',penWho:'For whom?',penReason:'Reason',penPh:'e.g. Fighting with siblings',penQuick:'Common reasons (tap to pick)',penPts:'Stars to deduct',penBtn:'Deduct stars',penHist:'History',penNone:'Nothing here yet.',penUndo:'Undo and return stars',penDone:n=>`Stars deducted from ${n}`,penUndone:'Penalty undone, stars returned',penPick:'Pick at least one child',penKid:n=>`${n} star${n>1?'s':''} deducted`,
  rewardsMgr:'Manage rewards',rewardsP:'Add the rewards that suit your family and a star price for each. Children see exactly what you add.',rewName:'Reward name',rewPh:'e.g. One hour of video games',rewCost:'Price in stars',addReward:'Add reward',rewAdded:'Reward added',rewPhoto:'Reward photo',rewUseIcon:'Use the icon instead',rewPhotoOpt:'Photo (optional)',rewAddPhoto:'Add a photo',rewPhotoHint:'Take a photo of the treat or place the kids love; it shows instead of the icon.',rewDeleted:'Reward deleted',noRewardsP:'No rewards yet. Add the first one below.',noRewards:'No rewards yet.',
  sndBig:'The file is too large; pick a shorter clip (under about 700 KB, around 30 seconds)',sndSaving:'Uploading the sound to the children\'s devices…',sndSaved:'Sound saved; it will reach the children\'s devices',
  adhanNote:'The adhan plays on every device with the app open (children and parents) using the sound you chose. Opened within 15 minutes of the prayer time, it plays right away. It cannot play on a locked device or a fully closed app.',playAdhan:'Play adhan'
});
let lang='ar';try{lang=localStorage.getItem('najmati-lang')||'ar'}catch(e){}
const L=(k,...a)=>{const v=T[lang][k];return typeof v==='function'?v(...a):v};
const tr=x=>x&&typeof x==='object'?(x[lang]||x.ar):x;

/* ---------- data ---------- */
const COLS={blue:'var(--blue)',gold:'var(--gold)',orange:'#FF8A2B',green:'var(--green)',coral:'var(--coral)',violet:'#8A63FF',teal:'#16A9C9',pink:'#F0569F'};
const ICPICK=['book','math','sparkle','toys','bed','plate','heart','ball','drop','palette','tree','game','star'];
const PRESETS=[['quran','القرآن','Quran','sparkle','violet'],['sport','الرياضة','Sports','ball','teal'],['manners','الأخلاق والسلوك','Manners','heart','pink'],['health','الصحة والنظافة','Health & hygiene','drop','coral'],['hobby','الهوايات','Hobbies','palette','gold']];
const BUILTIN=['prayer','study'];
const PRAYER_CAT={id:'prayer',name:{ar:'الصلاة',en:'Prayer'},ic:'mosque',col:'blue'};
const allCats=()=>[PRAYER_CAT,...S.cats];
const catById=id=>allCats().find(c=>c.id===id)||{id,name:id,ic:'tag',col:'blue'};
const catCls=id=>BUILTIN.includes(id)?id:'cc';
const catSty=id=>`--cc:${COLS[catById(id).col]||COLS.blue}`;
let newIc='heart',newCol='violet';
const ALL=[0,1,2,3,4,5,6];
const FIXED=[['fajr','صلاة الفجر','Fajr prayer','sunrise',2],['dhuhr','صلاة الظهر','Dhuhr prayer','sun',1],['asr','صلاة العصر','Asr prayer','cloudsun',1],['maghrib','صلاة المغرب','Maghrib prayer','sunset',1],['isha','صلاة العشاء','Isha prayer','moon',1]];
const DEF_CATS=[{id:'study',name:{ar:'المذاكرة',en:'Study'},ic:'book',col:'gold'},{id:'home',name:{ar:'ترتيب البيت',en:'Home chores'},ic:'toys',col:'orange'}];

function newFamily(uid,email){
  const t=(id,ar,en,cat,ic,points,time,days=ALL,kids=['k1','k2','k3'])=>({id,title:{ar,en},cat,ic,points,time,days,kids});
  return {parents:[uid],email,created:serverTimestamp(),city:'dubai',
    kids:[{id:'k1',name:{ar:'فارس',en:'Fares'},look:'boy'},{id:'k2',name:{ar:'سلطان',en:'Sultan'},look:'boy2'},{id:'k3',name:{ar:'إيلاف',en:'Elaf'},look:'girl',g:'f'}],
    points:{k1:0,k2:0,k3:0},cats:DEF_CATS,
    tasks:[t('s1','حل الواجبات المدرسية','Do the homework','study','math',3,'16:00',[0,1,2,3,4]),t('s2','قراءة ١٥ دقيقة','Read for 15 minutes','study','book',2,'18:30'),
      t('h1','ترتيب السرير','Make the bed','home','bed',1,'07:00'),t('h2','ترتيب الألعاب','Tidy up toys','home','toys',1,'20:00')],
    rewards:[{id:'r1',title:{ar:'ساعة لعب إضافية',en:'Extra hour of play'},ic:'game',cost:30},{id:'r2',title:{ar:'نزهة في الحديقة',en:'Trip to the park'},ic:'tree',cost:50},{id:'r3',title:{ar:'آيسكريم',en:'Ice cream'},ic:'ice',cost:20},{id:'r4',title:{ar:'اختيار عشاء الجمعة',en:'Pick Friday dinner'},ic:'pizza',cost:40}],
    adhan:{on:true,pr:{fajr:true,dhuhr:true,asr:true,maghrib:true,isha:true},snd:'chime'}};
}

/* live state: F is the family document, LT/LP are today's and pending logs; S is the view model built from them */
let me=null,M=null,F=null,fid=null,LT=[],LP=[],LPen=[],DEV=[],subs=[],logDay='',gate={screen:'welcome',busy:false};
const V={role:'kid',kid:'k1',tab:'today',ptab:'requests'};
let S={kids:[],tasks:[],cats:[],rewards:[],logs:[],city:'dubai',adhan:{on:false,pr:{}},view:V,sim:null};
function rebuild(){
  const kids=(F.kids||[]).map(k=>({...k,points:(F.points||{})[k.id]||0}));
  const pr=FIXED.map((f,i)=>({id:'p'+(i+1),title:{ar:f[1],en:f[2]},cat:'prayer',ic:f[3],points:f[4],time:'00:00',pr:f[0],fixed:true,days:ALL,kids:kids.map(k=>k.id)}));
  const lm=new Map();for(const l of [...LT,...LP])if(!('quiz' in l))lm.set(l.id,l);
  S={kids,tasks:[...pr,...(F.tasks||[])],cats:F.cats||DEF_CATS,rewards:F.rewards||[],logs:[...lm.values()],city:F.city||'dubai',adhan:F.adhan||{on:false,pr:{}},cheer:F.cheer||{},view:V,sim:null};
  if(M.role==='kid'){V.role='kid';V.kid=M.kid}
  else if(!kids.find(k=>k.id===V.kid)&&kids[0])V.kid=kids[0].id;
}
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const kid=id=>S.kids.find(k=>k.id===id);
const task=id=>S.tasks.find(t=>t.id===id);
const log=(t,k)=>S.logs.find(l=>l.task===t&&l.kid===k&&l.date===today());
const fmt=t=>{let[h,m]=t.split(':').map(Number);const p=h<12?L('am'):L('pm');h=h%12||12;return `${h}:${String(m).padStart(2,'0')} ${p}`};
const todays=k=>S.tasks.filter(t=>t.fixed||(t.kids.includes(k)&&t.days.includes(localDow()))).sort((a,b)=>tm(a).localeCompare(tm(b)));
const kn=k=>esc(tr(k.name));
const famRef=()=>doc(db,'families',fid);
const logsCol=()=>collection(db,'families',fid,'logs');
const fail=e=>{console.error(e);toast(navigator.onLine?L('err'):L('offline'))};
const famUpdate=o=>updateDoc(famRef(),o).catch(fail);
const FACE={
 girl:(c)=>`<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="32" fill="${c}"/><path d="M12 40c-2-18 8-28 20-28s22 10 20 28l-4 10H16z" fill="#5A3622"/><circle cx="32" cy="35" r="15" fill="#F7C9A3"/><path d="M17 31c2-9 9-13 15-13s13 4 15 13c-6-1-11-4-14-8-3 4-9 7-16 8z" fill="#5A3622"/><circle cx="26.5" cy="35" r="2" fill="#2B1B12"/><circle cx="37.5" cy="35" r="2" fill="#2B1B12"/><circle cx="23" cy="40" r="2.6" fill="#FF8FA3" opacity=".6"/><circle cx="41" cy="40" r="2.6" fill="#FF8FA3" opacity=".6"/><path d="M28 42q4 3.5 8 0" stroke="#B5523B" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="47" cy="22" r="4" fill="#FF6B8E"/></svg>`,
 boy2:(c)=>`<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="32" fill="${c}"/><circle cx="32" cy="37" r="15" fill="#D9A27A"/><path d="M16 31c0-9 7-15 16-15s16 6 16 15H16z" fill="#E5483B"/><path d="M15 31h26c4 0 9 1 11 3H15z" fill="#B8302A"/><circle cx="32" cy="17" r="2.5" fill="#fff"/><circle cx="26.5" cy="37.5" r="2" fill="#2B1B12"/><circle cx="37.5" cy="37.5" r="2" fill="#2B1B12"/><circle cx="23" cy="42" r="2.4" fill="#FF8F7A" opacity=".5"/><circle cx="41" cy="42" r="2.4" fill="#FF8F7A" opacity=".5"/><path d="M27 44q5 4.5 10 0" stroke="#8E3F2A" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="17" cy="38" r="2.6" fill="#D9A27A"/><circle cx="47" cy="38" r="2.6" fill="#D9A27A"/></svg>`,
 boy:(c)=>`<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="32" fill="${c}"/><circle cx="32" cy="36" r="15" fill="#E9B48C"/><path d="M16 33c-1-11 6-17 16-17s17 6 16 17c-3-4-8-7-16-7-5 0-10 2-12 4z" fill="#2E211A"/><circle cx="26.5" cy="36" r="2" fill="#2B1B12"/><circle cx="37.5" cy="36" r="2" fill="#2B1B12"/><circle cx="23" cy="41" r="2.4" fill="#FF8F7A" opacity=".5"/><circle cx="41" cy="41" r="2.4" fill="#FF8F7A" opacity=".5"/><path d="M27.5 43q4.5 4 9 0" stroke="#9C4A33" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="17" cy="37" r="2.6" fill="#E9B48C"/><circle cx="47" cy="37" r="2.6" fill="#E9B48C"/></svg>`
};
const AVBG={k1:'#CFE6FF',k2:'#FFE7A8',k3:'#FFD1DF'};
const avBg=id=>AVBG[id]||['#D9F5E6','#E8DEFF','#FFE0CC'][id.length%3];
const av=(k,cls='')=>`<span class="av ${esc(k.id)} ${cls}">${k.photo?`<img src="${k.photo}" alt="">`:FACE[k.look||'boy'](avBg(k.id))}</span>`;
function pickPhoto(kidId){const inp=document.createElement('input');inp.type='file';inp.accept='image/*';
  inp.onchange=()=>{const f=inp.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{
    const sz=256,c=document.createElement('canvas');c.width=c.height=sz;const g=c.getContext('2d');const m=Math.min(im.width,im.height);
    g.drawImage(im,(im.width-m)/2,(im.height-m)/2,m,m,0,0,sz,sz);
    famUpdate({kids:F.kids.map(k=>k.id===kidId?{...k,photo:c.toDataURL('image/jpeg',.8)}:k)}).then(()=>toast(L('photoSaved')))};im.src=r.result};r.readAsDataURL(f)};
  inp.click()}

function pickImage(sz,cb){const inp=document.createElement('input');inp.type='file';inp.accept='image/*';
  inp.onchange=()=>{const f=inp.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{
    const c=document.createElement('canvas');c.width=c.height=sz;const g=c.getContext('2d');const m=Math.min(im.width,im.height);
    g.drawImage(im,(im.width-m)/2,(im.height-m)/2,m,m,0,0,sz,sz);cb(c.toDataURL('image/jpeg',.78))};im.src=r.result};r.readAsDataURL(f)};inp.click()}
function toast(msg){const el=document.createElement('div');el.className='toast';el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),2600)}
function sheet(html){const el=document.createElement('div');el.className='sheet';el.innerHTML=`<div class="card glass" dir="${lang==='ar'?'rtl':'ltr'}">${html}</div>`;el.addEventListener('click',e=>{if(e.target===el)el.remove()});document.body.appendChild(el);return el}
function burst(x,y){for(let i=0;i<12;i++){const s=document.createElement('span');s.className='burst';s.innerHTML=I('star');const a=Math.PI*2*i/12;s.style.left=x+'px';s.style.top=y+'px';s.style.setProperty('--dx',Math.cos(a)*120+'px');s.style.setProperty('--dy',Math.sin(a)*120+'px');document.body.appendChild(s);setTimeout(()=>s.remove(),1000)}}

/* ---------- prayer times (computed on device, per country method) ---------- */
const METHODS={uae:{f:18.2,i:18.2},umm:{f:18.5,im:90},kw:{f:18,i:17.5},qa:{f:18,im:90},mwl:{f:18,i:17},eg:{f:19.5,i:17.5},jo:{f:18,i:18}};
const PLACES=[
 {id:'ae',ar:'الإمارات',en:'UAE',m:'uae',z:'Asia/Dubai',cities:[['dubai','دبي','Dubai',25.2048,55.2708],['abudhabi','أبوظبي','Abu Dhabi',24.4539,54.3773],['sharjah','الشارقة','Sharjah',25.3463,55.4209],['ajman','عجمان','Ajman',25.4052,55.5136],['uaq','أم القيوين','Umm Al Quwain',25.5647,55.5552],['rak','رأس الخيمة','Ras Al Khaimah',25.8007,55.9762],['fujairah','الفجيرة','Fujairah',25.1288,56.3265],['alain','العين','Al Ain',24.2075,55.7447]]},
 {id:'sa',ar:'السعودية',en:'Saudi Arabia',m:'umm',z:'Asia/Riyadh',cities:[['riyadh','الرياض','Riyadh',24.7136,46.6753],['jeddah','جدة','Jeddah',21.4858,39.1925],['makkah','مكة المكرمة','Makkah',21.3891,39.8579],['madinah','المدينة المنورة','Madinah',24.5247,39.5692],['dammam','الدمام','Dammam',26.4207,50.0888]]},
 {id:'kw',ar:'الكويت',en:'Kuwait',m:'kw',z:'Asia/Kuwait',cities:[['kuwait','مدينة الكويت','Kuwait City',29.3759,47.9774]]},
 {id:'qa',ar:'قطر',en:'Qatar',m:'qa',z:'Asia/Qatar',cities:[['doha','الدوحة','Doha',25.2854,51.531]]},
 {id:'bh',ar:'البحرين',en:'Bahrain',m:'umm',z:'Asia/Bahrain',cities:[['manama','المنامة','Manama',26.2285,50.586]]},
 {id:'om',ar:'عُمان',en:'Oman',m:'mwl',z:'Asia/Muscat',cities:[['muscat','مسقط','Muscat',23.588,58.3829],['salalah','صلالة','Salalah',17.0151,54.0924]]},
 {id:'eg',ar:'مصر',en:'Egypt',m:'eg',z:'Africa/Cairo',cities:[['cairo','القاهرة','Cairo',30.0444,31.2357],['alex','الإسكندرية','Alexandria',31.2001,29.9187]]},
 {id:'jo',ar:'الأردن',en:'Jordan',m:'jo',z:'Asia/Amman',cities:[['amman','عمّان','Amman',31.9454,35.9284]]}
];
const PRAYERS=['fajr','dhuhr','asr','maghrib','isha'];
function place(){for(const c of PLACES)for(const x of c.cities)if(x[0]===S.city)return{country:c,id:x[0],ar:x[1],en:x[2],lat:x[3],lng:x[4]};const c=PLACES[0],x=c.cities[0];return{country:c,id:x[0],ar:x[1],en:x[2],lat:x[3],lng:x[4]}}
function tzParts(z,d){const p=new Intl.DateTimeFormat('en-US',{timeZone:z,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',weekday:'short'}).formatToParts(d);const g=t=>+p.find(x=>x.type===t).value;return{y:g('year'),mo:g('month'),d:g('day'),h:g('hour')%24,mi:g('minute'),wd:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(p.find(x=>x.type==='weekday').value)}}
function tzOff(z,d){const q=tzParts(z,d);return Math.round((Date.UTC(q.y,q.mo-1,q.d,q.h,q.mi)-d.getTime())/9e5)/4}
/* the family's city decides "today", so every device in the family agrees on the date */
const today=()=>{const q=tzParts(place().country.z,new Date());return `${q.y}-${String(q.mo).padStart(2,'0')}-${String(q.d).padStart(2,'0')}`};
const localDow=()=>tzParts(place().country.z,new Date()).wd;
const now=()=>{const q=tzParts(place().country.z,new Date());return `${String(q.h).padStart(2,'0')}:${String(q.mi).padStart(2,'0')}`};
let _pt=null,_ptKey='';
function prayerTimes(){
  const c=place(),now=new Date(),lp=tzParts(c.country.z,now),key=c.id+lp.y+lp.mo+lp.d;if(_pt&&_ptKey===key)return _pt;
  const tz=tzOff(c.country.z,now),m=METHODS[c.country.m],R=Math.PI/180;
  const sin=x=>Math.sin(x*R),cos=x=>Math.cos(x*R),tan=x=>Math.tan(x*R),fix=(a,b)=>((a%b)+b)%b;
  const D=Date.UTC(lp.y,lp.mo-1,lp.d,12)/864e5+2440587.5-tz/24-2451545;
  const g=fix(357.529+0.98560028*D,360),q=fix(280.459+0.98564736*D,360),L=fix(q+1.915*sin(g)+0.020*sin(2*g),360),e=23.439-0.00000036*D;
  const RA=fix(Math.atan2(cos(e)*sin(L),cos(L))/R/15,24),decl=Math.asin(sin(e)*sin(L))/R;let eqt=q/15-RA;if(eqt>12)eqt-=24;if(eqt<-12)eqt+=24;
  const dh=12+tz-c.lng/15-eqt;
  const T=a=>Math.acos((-sin(a)-sin(decl)*sin(c.lat))/(cos(decl)*cos(c.lat)))/R/15;
  const asrAlt=Math.atan(1/(1+tan(Math.abs(c.lat-decl))))/R;
  const h={fajr:dh-T(m.f),sunrise:dh-T(.833),dhuhr:dh+2/60,asr:dh+T(-asrAlt),maghrib:dh+T(.833)};
  h.isha=m.im?h.maghrib+m.im/60:dh+T(m.i);
  h.midnight=Math.min(24-1/60,h.maghrib+(h.fajr+24-h.maghrib)/2);
  _pt={};for(const k in h)_pt[k]=Math.ceil(h[k]*60);_ptKey=key;return _pt;
}
const WIN={fajr:'sunrise',dhuhr:'asr',asr:'maghrib',maghrib:'isha',isha:'midnight'};
const hhmm=n=>`${String(Math.floor(n/60)%24).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
const tm=t=>t.pr?hhmm(prayerTimes()[t.pr]):t.time;
function nowMin(){const q=tzParts(place().country.z,new Date());return q.h*60+q.mi}
/* a missed prayer must be made up (qada, no star) before a later prayer can be logged */
function owedPrayer(kidId){for(const k2 of PRAYERS){const t=todays(kidId).find(x=>x.pr===k2);if(!t)continue;const l=log(t.id,kidId);if((!l||l.status==='rejected')&&prayerState(t).s==='missed')return t}return null}
function prayerState(t){const p=prayerTimes(),n=nowMin(),st=p[t.pr],en=p[WIN[t.pr]];return n<st?{s:'locked',left:st-n}:n<en?{s:'now',left:en-n,end:en}:{s:'missed',end:en}}
const dur=m=>{const h=Math.floor(m/60),mm=m%60;return lang==='ar'?(h?`${h} س `:'')+`${mm} د`:(h?`${h}h `:'')+`${mm}m`};

/* ---------- theme, palette, language ---------- */
let theme=null;try{theme=localStorage.getItem('najmati-theme')}catch(e){}
const mq=matchMedia('(prefers-color-scheme: dark)');
const isDark=()=>{const a=document.documentElement.dataset.theme;return a?a==='dark':mq.matches};
function applyTheme(){if(theme)document.documentElement.dataset.theme=theme;$('#mode').innerHTML=isDark()?I('sun'):I('moon');const tl=isDark()?L('dayMode'):L('nightMode');$('#mode').title=tl;$('#mode').setAttribute('aria-label',tl);
  const mc=document.querySelector('meta[name=theme-color]');if(mc)mc.content=isDark()?'#0B1640':'#7CC8F5'}

let pal='royal';try{pal=localStorage.getItem('najmati-pal')||'royal'}catch(e){}
if(!['royal','web','sea','speed','blocks'].includes(pal))pal='royal';
function applyPal(){document.documentElement.dataset.palette=pal;let cur;document.querySelectorAll('#palMenu button').forEach(b=>{const on=b.dataset.pal===pal;b.setAttribute('aria-selected',on);if(on)cur=b});
  if(cur){$('#palName').textContent=L('p_'+pal);$('#palSw').style.cssText=cur.getAttribute('style')}}
function palOpen(o){$('#palMenu').hidden=!o;$('#palBtn').setAttribute('aria-expanded',o)}
document.addEventListener('click',e=>{if(!e.target.closest('#pal'))palOpen(false)},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')palOpen(false)});

function applyLang(){
  const app=$('#app');app.dir=lang==='ar'?'rtl':'ltr';app.lang=lang;document.documentElement.lang=lang;document.title=L('brand');
  document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=L(el.dataset.i18n));
  $('#lang').innerHTML=`${I('globe')}<span>${L('langBtn')}</span>`;$('#lang').title=L('langTitle');$('#lang').setAttribute('aria-label',L('langTitle'));
  $('#palBtn').setAttribute('aria-label',L('colors'));
  applyPal();applyTheme();
}

/* ---------- views ---------- */
function render(){
  const ready=!!(F&&M);
  $('#roles').hidden=!(ready&&M.role==='parent');
  if(!ready){$('#view').innerHTML=gateView();installHint();return}
  if(M.role==='kid'&&kid(M.kid)?.pin&&!unlocked()){document.querySelectorAll('.sheet').forEach(x=>x.remove());$('#view').innerHTML=pinView();return}
  $('#roleKid').setAttribute('aria-pressed',V.role==='kid');
  $('#roleParent').setAttribute('aria-pressed',V.role==='parent');
  $('#view').innerHTML=V.role==='kid'?kidView():parentView();
  installHint();placeBuddy();
}
/* data from another device re-renders, but never while someone is typing in a form */
let renderLater=false;
function softRender(){if(document.activeElement?.matches?.('#view input,#view select')){renderLater=true;return}render()}
document.addEventListener('focusout',()=>setTimeout(()=>{if(renderLater&&!document.activeElement?.matches?.('#view input,#view select')){renderLater=false;render()}},0));
function installHint(){const n=$('#install');if(!n)return;const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(standalone){n.hidden=true;return}
  if(deferredInstall){n.hidden=false;n.innerHTML=`<button class="btn sun sm" id="doInstall">${I('upload')}${L('installBtn')}</button>`}
  else if(ios){n.hidden=false;n.innerHTML=`${I('share')} ${L('installIos')}`}else n.hidden=true}
let deferredInstall=null;addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;installHint()});

function gateView(){
  const g=gate.screen;
  if(!CFG)return `<section class="gate panel glass"><span class="logoBig">${I('star')}</span><h2>${L('setupTitle')}</h2><p>${L('setupP')}</p></section>`;
  if(g==='loading')return `<section class="gate panel glass"><span class="logoBig spin">${I('star')}</span><p>${L('loading')}</p></section>`;
  if(g==='welcome')return `<section class="gate panel glass"><span class="logoBig appIc"><img src="icons/apple-touch-icon.png?v=2" alt=""></span><h2>${L('welcome')}</h2><p>${L('welcomeP')}</p>
    <div class="choose"><button class="choice glass" id="goParent"><span class="chip prayer">${I('users')}</span><b>${L('iAmParent')}</b><small>${L('iAmParentP')}</small></button>
    <button class="choice glass" id="goKid"><span class="chip study">${I('tablet')}</span><b>${L('iAmKid')}</b><small>${L('iAmKidP')}</small></button></div></section>`;
  if(g==='login'||g==='signup')return `<section class="gate panel glass"><button class="btn no sm backBtn" id="gateBack">${I('back')}${L('back')}</button>
    <span class="logoBig">${I('users')}</span><h2>${L(g)}</h2>
    <div class="tabs"><button class="glass" id="tLogin" aria-pressed="${g==='login'}">${L('login')}</button><button class="glass" id="tSignup" aria-pressed="${g==='signup'}">${L('signup')}</button></div>
    <form id="authForm" class="gateForm">
      <label for="aEmail">${L('email')}<input id="aEmail" type="email" autocomplete="email" required dir="ltr" value="${esc(gate.email||'')}"></label>
      <label for="aPass">${L('password')}<input id="aPass" type="password" autocomplete="${g==='login'?'current-password':'new-password'}" required minlength="6" dir="ltr" placeholder="${L('pwHint')}"></label>
      <button class="btn go" type="submit" ${gate.busy?'disabled':''}>${I('check')}${L(g)}</button>
      ${g==='login'?`<button type="button" class="linkBtn" id="forgot">${L('forgot')}</button>`:''}
    </form></section>`;
  if(g==='kid')return `<section class="gate panel glass"><button class="btn no sm backBtn" id="gateBack">${I('back')}${L('back')}</button>
    <span class="logoBig">${I('link')}</span><h2>${L('linkTitle')}</h2><p>${L('linkP')}</p>
    <form id="codeForm" class="gateForm"><label for="aCode">${L('codeLbl')}<input id="aCode" class="codeIn" required maxlength="6" autocomplete="off" autocapitalize="characters" spellcheck="false" dir="ltr" placeholder="••••••"></label>
    <button class="btn go" type="submit" ${gate.busy?'disabled':''}>${I('link')}${L('linkBtn')}</button></form></section>`;
  return '';
}
let pinBuf='';
const unlocked=()=>{try{return sessionStorage.getItem('najmati-unlocked')===M.kid}catch(e){return pinOk}};let pinOk=false;
function pinView(){const k=kid(M.kid);return `<section class="gate panel glass pinBox">${av(k,'lg')}<h2>${L('pinTitle',kn(k))}</h2>
  <div class="pinDots">${[0,1,2,3].map(i=>`<i class="${i<pinBuf.length?'on':''}"></i>`).join('')}</div>
  <div class="pinPad" dir="ltr">${[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(n=>n===''?'<span></span>':`<button class="glass" data-pin="${n}">${n}</button>`).join('')}</div></section>`}

function kidPicker(){return M.role==='parent'?`<div class="kids">${S.kids.map(k=>`<button class="kid glass" data-kid="${k.id}" aria-pressed="${V.kid===k.id}">${av(k)}${kn(k)}</button>`).join('')}</div>`:''}

function kidView(){
  const k=kid(V.kid);if(!k)return '';const list=todays(k.id);
  const done=list.filter(t=>log(t.id,k.id)?.status==='approved').length;
  const pct=list.length?Math.round(done/list.length*100):0;
  const tab=V.tab;
  const pens=S.logs.filter(l=>l.pen&&l.kid===k.id&&l.date===today());
  let body='';
  if(tab==='today'){
    const owed=owedPrayer(k.id);
    body=allCats().map(cc=>{const c=cc.id;
      const ts=list.filter(t=>t.cat===c); if(!ts.length)return '';
      return `<section class="group ${catCls(c)}" style="${catSty(c)}"><h3><span class="chip">${I(cc.ic)}</span>${esc(tr(cc.name))}${c==='prayer'?`<small class="loc">${I('pin')} ${esc(tr(place()))}</small>`:''}<small>${ts.filter(t=>log(t.id,k.id)?.status==='approved').length}/${ts.length}</small></h3><div class="grid">${ts.map(t=>{
        let st=log(t.id,k.id)?.status, extra='';
        const lg=log(t.id,k.id),qd=lg?.qada&&lg.status!=='rejected';
        if(t.pr&&(!st||st==='rejected')){const ps=prayerState(t);if(ps.s!=='now'||!st){st=ps.s;extra=ps.s==='locked'?L('startsIn',dur(ps.left)):ps.s==='now'?L('leftNow',dur(ps.left)):ps.s==='missed'?L('qadaHint',k.g==='f'):''}
          const ow=owed;if(ow&&ow.id!==t.id&&ps.s==='now'&&PRAYERS.indexOf(ow.pr)<PRAYERS.indexOf(t.pr)){st='owed';extra=L('qadaFirst',L('pn_'+ow.pr),k.g==='f')}}
        const label={pending:I('hourglass')+L('pending'),approved:I('check')+L('approved'),rejected:I('retry')+L('rejected'),locked:I('lock')+L('locked'),now:I('bell')+L('nowLbl'),missed:I('retry')+L('qadaNow'),owed:I('lock')+L('qadaLock')}[st]||'';
        const lb=qd?(st==='approved'?I('check')+L('qadaDone'):I('hourglass')+L('qadaPend')):label;
        return `<button class="task glass ${catCls(c)} ${st?'s-'+st:''} ${qd?'s-qada':''}" style="${catSty(c)}" data-task="${t.id}">
          ${st==='approved'&&!qd?`<span class="seal">${I('check')}</span>`:lb?`<span class="state">${lb}</span>`:''}
          <span class="chip">${I(t.ic)}</span><span class="t">${esc(tr(t.title))}</span>${st==='approved'&&!qd?`<span class="wow">${I('star')} ${L('wow')}</span>`:''}
          ${extra?`<span class="hint">${extra}</span>`:''}<span class="meta"><span>${I('clock')} ${fmt(tm(t))}${t.pr?` – ${fmt(hhmm(prayerTimes()[WIN[t.pr]]))}`:''}</span><span class="pts">${I('star')} <bdi dir="ltr">${qd||st==='missed'?'0':'+'+t.points}</bdi></span></span></button>`}).join('')}</div></section>`}).join('');
  }else if(tab==='play'){body=playView(k)
  }else{
    body=`<section class="group reward"><h3><span class="chip">${I('trophy')}</span>${L('swap')}</h3>${S.rewards.length?'':`<p class="empty">${L('noRewards')}</p>`}<div class="grid">${S.rewards.map(r=>{
      const can=k.points>=r.cost;
      return `<button class="task glass reward" data-reward="${r.id}" ${can?'':'aria-disabled="true"'}>
        ${r.img?`<span class="rewImg"><img src="${r.img}" alt=""></span>`:`<span class="chip">${I(r.ic)}</span>`}<span class="t">${esc(tr(r.title))}</span>
        <span class="meta"><span>${can?L('canNow'):L('left',r.cost-k.points)}</span><span class="pts">${I('star')} ${r.cost}</span></span></button>`}).join('')}</div></section>`;
  }
  return `${kidPicker()}
  <section class="hero glass">
    <div class="heroMe">${av(k,'lg')}<div><h2>${L('hi',kn(k))}</h2><p>${L('heroP')}</p></div></div>
    <div class="jar" id="jar"><b>${I('star')}<bdi dir="ltr">${k.points}</bdi></b><span>${L('stars')}</span></div>
    <div class="progress"><div class="track"><i style="width:${pct}%"></i></div><small>${L('doneOf',done,list.length)}</small></div>
  </section>
  <div class="kidTabs"><button class="tToday" data-tab="today" aria-pressed="${tab==='today'}"><span class="bigIc">${I('clipboard')}</span><span>${L('todayTasks')}<small>${L('doneShort',done,list.length)}</small></span></button><button class="tRew" data-tab="rewards" aria-pressed="${tab==='rewards'}"><span class="bigIc">${I('trophy')}</span><span>${L('rewards')}<small>${L('canCount',S.rewards.filter(r=>k.points>=r.cost).length)}</small></span></button><button class="tPlay" data-tab="play" aria-pressed="${tab==='play'}"><span class="bigIc">${I('game')}</span><span>${L('play')}<small>${L('jDone',QZ.filter(J=>qLog(k.id,J.id)).length,QZ.length)}</small></span></button></div>
  ${buddyOff&&tab==='today'?`<button class="buddyOn" data-buddyon="1">${I('sparkle')} ${L('bShow')}</button>`:''}
  ${pens.length?`<section class="penBox">${pens.map(l=>`<div class="penItem ${l.bonus?'bonus':''}"><span class="chip">${I(l.bonus?'gift':'warn')}</span><div><b>${esc(l.reason)}</b><small>${L(l.bonus?'bonKid':'penKid',l.pts)}</small></div><span class="penPts ${l.bonus?'plus':''}"><bdi dir="ltr">${l.bonus?'+':'−'}${l.pts}</bdi> ${I('star')}</span></div>`).join('')}</section>`:''}
  ${body}`;
}

function familyView(){
  return `<section class="panel glass"><h3><span class="chip prayer">${I('users')}</span>${L('family')}</h3>
  <div class="famList">${S.kids.map(k=>{const devs=DEV.filter(d=>d.kid===k.id);
    return `<div class="famKid"><div class="avBox">${av(k,'lg')}<div class="avTools"><button class="ico" data-photo="${k.id}" title="${L('changePhoto')}" aria-label="${L('changePhoto')}">${I('camera')}</button><button class="ico del" data-unphoto="${k.id}" title="${L('removePhoto')}" aria-label="${L('removePhoto')}" ${k.photo?'':'disabled'}>${I('trash')}</button></div></div>
    <form class="kidForm" data-kidform="${k.id}">
      <label>${L('kidName')}<input name="ar" required value="${esc(k.name.ar)}"></label>
      <label>${L('kidNameEn')}<input name="en" dir="ltr" value="${esc(k.name.en||'')}"></label>
      <label>${L('gender')}<select name="gender"><option value="b" ${k.look!=='girl'?'selected':''}>${L('boyLbl')}</option><option value="g" ${k.look==='girl'?'selected':''}>${L('girlLbl')}</option></select></label>
      <label>${L('pin')}<input name="pin" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" dir="ltr" placeholder="${L('pinPh')}" value="${esc(k.pin||'')}"></label>
      <div class="full row" style="justify-content:flex-start"><button class="btn go sm" type="submit">${I('save')}${L('saveBtn')}</button><button class="btn sun sm" type="button" data-linkdev="${k.id}">${I('link')}${L('linkDev')}</button><button class="btn no sm" type="button" data-delkid="${k.id}">${I('trash')}${L('delKid')}</button></div>
    </form>
    <div class="devs"><b>${I('tablet')} ${L('devices')}</b>${devs.length?devs.map(d=>`<span class="devPill">${esc(d.dev||'iPad')}<button class="ico del" data-unlink="${d.id}" title="${L('unlink')}" aria-label="${L('unlink')}">${I('x')}</button></span>`).join(''):`<small>${L('noDevices')}</small>`}</div></div>`}).join('')}</div>
  <form id="newKid" class="kidForm newKid"><label>${L('kidName')}<input name="ar" required></label><label>${L('kidNameEn')}<input name="en" dir="ltr" placeholder="${L('enAuto')}"></label><label>${L('gender')}<select name="gender"><option value="b">${L('boyLbl')}</option><option value="g">${L('girlLbl')}</option></select></label><div><button class="btn sun" type="submit">${I('plus')}${L('addKid')}</button></div></form></section>
  <section class="panel glass"><h3><span class="chip study">${I('user')}</span>${L('account')}</h3><p style="margin:0">${L('loggedAs',`<bdi>${esc(me?.email||'')}</bdi>`)}</p><small style="color:var(--muted)">${L('sharedLogin')}</small>
  <div><button class="btn no" id="logout">${I('logout')}${L('logout')}</button></div></section>`;
}

const REWIC=['gift','game','tree','ice','pizza','tv','bike','cake','cash','ball','book','palette','toys','heart','star'];
let newRewIc='gift',newRewImg=null;
function rewardsView(){
  return `<section class="panel glass"><h3><span class="chip" style="background:linear-gradient(135deg,#FFB547,#F0569F)">${I('trophy')}</span>${L('rewardsMgr')}</h3>
  <p style="margin:0;color:var(--muted)">${L('rewardsP')}</p>
  ${S.rewards.length?`<div class="rewList">${S.rewards.map(r=>`<div class="rewCard"><div class="rewPic">${r.img?`<img src="${r.img}" alt="">`:`<span class="chip">${I(r.ic)}</span>`}</div><b class="rewT">${esc(tr(r.title))}</b><div class="rewFoot"><span class="rewCost">${I('star')}<bdi dir="ltr">${r.cost}</bdi></span><span class="rewActs"><button class="ico" data-rewphoto="${r.id}" title="${L('rewPhoto')}" aria-label="${L('rewPhoto')}">${I('camera')}</button>${r.img?`<button class="ico" data-rewunphoto="${r.id}" title="${L('rewUseIcon')}" aria-label="${L('rewUseIcon')}">${I('star')}</button>`:''}<button class="ico del" data-delrew="${r.id}" title="${L('del')}" aria-label="${L('del')}">${I('trash')}</button></span></div></div>`).join('')}</div>`:`<p class="empty">${L('noRewardsP')}</p>`}
  <form id="rewForm" class="catForm">
    <label for="rwName">${L('rewName')}<input id="rwName" required placeholder="${L('rewPh')}"></label>
    <label for="rwCost">${L('rewCost')}<input id="rwCost" type="number" min="1" max="1000" value="20" required></label>
    <div class="lbl">${L('rewPhotoOpt')}<div class="row" style="justify-content:flex-start;align-items:center">${newRewImg?`<span class="rewPrev"><img src="${newRewImg}" alt=""></span><button type="button" class="btn no sm" id="rwNoPhoto">${I('x')}${L('removePhoto')}</button>`:''}<button type="button" class="btn no sm" id="rwPhoto">${I('camera')}${newRewImg?L('changePhoto'):L('rewAddPhoto')}</button></div><small style="color:var(--muted)">${L('rewPhotoHint')}</small></div>
    <div class="lbl">${L('icon')}<div class="days icPick">${REWIC.map(k=>`<button type="button" data-rewic="${k}" aria-pressed="${k===newRewIc}" aria-label="${k}">${I(k)}</button>`).join('')}</div></div>
    <div><button class="btn sun" type="submit">${I('plus')}${L('addReward')}</button></div>
  </form></section>`;
}
const PEN_PRESETS={ar:['الشجار مع الإخوة','عدم احترام الكبار','الكذب','ألفاظ غير لائقة','إهمال الواجبات','عدم ترتيب الغرفة'],en:['Fighting with siblings','Disrespect to elders','Lying','Bad language','Skipping homework','Messy room']};
const BON_PRESETS={ar:['درجات ممتازة في الاختبار','مساعدة إخوته','برّ الوالدين','حفظ سورة جديدة','سلوك رائع أمام الضيوف','مبادرة بعمل خير'],en:['Great test marks','Helped siblings','Kind to parents','Memorised a new surah','Lovely manners with guests','Did a good deed']};
let penKids=[],penMode='bonus';
/* bonus stars and penalties share one form and one history; a bonus is a pen log with bonus:true and adds stars */
function penView(){
  const hist=LPen.slice().sort((a,b)=>(b.date+b.at).localeCompare(a.date+a.at)).slice(0,40),bon=penMode==='bonus',x=k=>L((bon?'bon':'pen')+k);
  return `<section class="panel glass penPanel ${bon?'isBonus':'isPen'}"><div class="penSeg" role="group"><button type="button" data-penmode="bonus" aria-pressed="${bon}">${I('plus')}${L('bonTab')}</button><button type="button" data-penmode="pen" aria-pressed="${!bon}">${I('minus')}${L('penTab')}</button></div>
  <h3><span class="chip" style="background:${bon?'linear-gradient(135deg,#7BE495,#21B26B)':'linear-gradient(135deg,var(--coral2),#E5383B)'}">${I(bon?'gift':'warn')}</span>${x('New')}</h3>
  <p style="margin:0;color:var(--muted)">${x('P')}</p>
  <form id="penForm" class="penForm">
    <div class="full lbl">${L('penWho')}<div class="days kidsPick" id="penKids">${S.kids.map(k=>`<button type="button" data-penk="${k.id}" aria-pressed="${penKids.includes(k.id)}">${av(k)}${kn(k)}</button>`).join('')}</div></div>
    <label class="full" for="penReason">${x('Reason')}<input id="penReason" required placeholder="${x('Ph')}"></label>
    <div class="full lbl">${L('penQuick')}<div class="days">${(bon?BON_PRESETS:PEN_PRESETS)[lang].map(t=>`<button type="button" class="preset" data-penpre="${esc(t)}" style="--cc:${bon?'#21B26B':'#E5383B'}">${esc(t)}</button>`).join('')}</div></div>
    <label for="penPts">${x('Pts')}<input id="penPts" type="number" min="1" max="100" value="2" required></label>
    <div><button class="btn penBtn ${bon?'bonBtn':''}" type="submit">${I(bon?'plus':'minus')}${x('Btn')}</button></div>
  </form></section>
  <section class="panel glass"><h3><span class="chip" style="background:linear-gradient(135deg,#B49BFF,#8A63FF)">${I('list')}</span>${L('penHist')}</h3>
  ${hist.length?`<div class="penHist">${hist.map(l=>{const k=kid(l.kid);return `<div class="req2"><span class="av">${k?av(k):''}</span><div class="who"><b>${esc(l.reason)}</b><small>${k?kn(k):''} · ${esc(l.date)} · ${fmt(l.at)}</small></div><span class="penPts ${l.bonus?'plus':''}"><bdi dir="ltr">${l.bonus?'+':'−'}${l.pts}</bdi> ${I('star')}</span><div class="acts"><button class="ico" data-unpen="${l.id}" title="${L('penUndo')}" aria-label="${L('penUndo')}">${I('retry')}</button></div></div>`}).join('')}</div>`:`<p class="empty">${L('penNone')}</p>`}</section>`;
}

function parentView(){
  const pt=V.ptab;
  const pend=S.logs.filter(l=>l.status==='pending');
  let body='';
  if(pt==='family')body=familyView();
  else if(pt==='rewards')body=rewardsView();
  else if(pt==='pen')body=penView();
  else if(pt==='requests'){
    body=`<section class="stats">${S.kids.map(k=>{const l=todays(k.id),d=l.filter(t=>log(t.id,k.id)?.status==='approved').length;
      return `<div class="panel glass stat"><div class="avBox">${av(k,'lg')}</div><div><div style="font-weight:700">${kn(k)}</div><b><bdi dir="ltr">${k.points}</bdi></b> ${L('stars')}<br><small style="color:var(--muted)">${L('todayOf',d,l.length)}</small>${(()=>{const n=l.filter(t=>t.pr&&!log(t.id,k.id)&&prayerState(t).s==='missed').length;return n?`<div class="missedTag">${I('x')} ${L('missedCount',n,k.g==='f')}</div>`:''})()}</div></div>`}).join('')}</section>
    <section class="panel glass"><h3><span class="chip" style="background:linear-gradient(135deg,var(--coral2),var(--coral))">${I('bell')}</span>${L('waiting',pend.length)}</h3>
    ${pend.length?`<div class="reqCols">${S.kids.map(k=>{const mine=pend.filter(l=>l.kid===k.id);
      return `<div class="reqKid ${mine.length?'':'clear'}"><div class="reqHead">${av(k)}<b>${kn(k)}</b><span class="cnt">${mine.length}</span>${mine.length>1?`<button class="btn go sm" data-okall="${k.id}">${I('check')}${L('approveAll')}</button>`:''}</div>
      ${mine.length?mine.map(l=>{const isR=l.reward;const t=isR?S.rewards.find(r=>r.id===l.reward):task(l.task);if(!t)return '';
        return `<div class="req2"><span class="chip ${isR?'':catCls(t.cat)}" ${isR?'style="background:linear-gradient(135deg,var(--coral2),var(--coral))"':`style="${catSty(t.cat)}"`}>${I(t.ic)}</span><div class="who"><b>${esc(tr(t.title))}</b><small>${isR?L('rewardReq',t.cost):l.qada?L('qadaReq',fmt(l.at),k.g==='f'):L('saysDone',fmt(l.at),t.points,k.g==='f')}</small></div>
        <div class="acts"><button class="ico ok" data-ok="${l.id}" title="${L('approve')}" aria-label="${L('approve')}">${I('check')}</button><button class="ico del" data-rej="${l.id}" title="${L('reject')}" aria-label="${L('reject')}">${I('x')}</button></div></div>`}).join('')
        :`<p class="empty sm">${I('check')} ${L('noReqKid')}</p>`}</div>`}).join('')}</div>`
      :`<p class="empty">${L('noReq')}</p>`}</section>`;
  }else{
    const DAYS=L('days');
    const pl=place(),pt2=prayerTimes();
    body=`<section class="panel glass"><h3><span class="chip prayer">${I('pin')}</span>${L('location')}</h3>
    <form id="locForm" onsubmit="return false">
      <label for="fCountry">${L('country')}<select id="fCountry">${PLACES.map(c=>`<option value="${c.id}" ${c.id===pl.country.id?'selected':''}>${tr(c)}</option>`).join('')}</select></label>
      <label for="fCity">${L('city')}<select id="fCity">${pl.country.cities.map(x=>`<option value="${x[0]}" ${x[0]===pl.id?'selected':''}>${lang==='ar'?x[1]:x[2]}</option>`).join('')}</select></label>
    </form>
    <div class="autoNote">${I('lock')} ${L('fixedNote')}</div><div class="ptimes">${PRAYERS.map(k=>`<div class="pt"><span>${L('pn_'+k)}</span><b>${fmt(hhmm(pt2[k]))}</b></div>`).join('')}</div>
    <small style="color:var(--muted)">${L('methodNote')}</small>
    <div class="adhanBox ${S.adhan.on?'':'off'}">
      <div class="adhanHead"><span class="chip" style="background:linear-gradient(135deg,var(--gold2),var(--gold))">${I('speaker')}</span><b>${L('adhanTitle')}</b><button class="switch" id="adOn" aria-pressed="${!!S.adhan.on}" aria-label="${L('adhanTitle')}"></button></div>
      <div class="lbl">${L('adhanFor')}<div class="days">${PRAYERS.map(k=>`<button type="button" data-adpr="${k}" aria-pressed="${!!S.adhan.pr?.[k]}">${I('bell')} ${L('pn_'+k)}</button>`).join('')}</div></div>
      <div class="lbl">${L('soundLbl')}<div class="days"><button type="button" data-snd="chime" aria-pressed="${S.adhan.snd!=='custom'}">${I('sparkle')} ${L('chime')}</button><button type="button" data-snd="custom" aria-pressed="${S.adhan.snd==='custom'}">${I('mosque')} ${L('customSnd')}${S.adhan.sndName?` · ${esc(S.adhan.sndName)}`:''}</button></div></div>
      <div class="row" style="justify-content:flex-start"><button class="btn sun sm" id="adTest">${I('play')}${L('testSnd')}</button><button class="btn no sm" id="adUp">${I('upload')}${L('uploadSnd')}</button></div>
      <small style="color:var(--muted)">${L('adhanNote')}</small>
    </div></section>
    ${cheerView()}
    <section class="panel glass"><h3><span class="chip" style="background:linear-gradient(135deg,#B49BFF,#8A63FF)">${I('tag')}</span>${L('types')}</h3>
      <div class="catList"><span class="catPill fixed"><span class="chip prayer">${I('mosque')}</span>${L('prayer')}<small>${I('lock')}</small></span>${S.cats.map(c=>{const n=S.tasks.filter(t=>t.cat===c.id).length;
        return `<span class="catPill"><span class="chip ${catCls(c.id)}" style="${catSty(c.id)}">${I(c.ic)}</span>${esc(tr(c.name))}<small>${L('taskCount',n)}</small><button class="ico del" data-delcat="${c.id}" aria-label="${L('del')}">${I('x')}</button></span>`}).join('')}</div>
      ${PRESETS.some(p=>!S.cats.find(c=>c.id===p[0]))?`<div class="lbl">${L('presets')}<div class="days">${PRESETS.filter(p=>!S.cats.find(c=>c.id===p[0])).map(p=>`<button type="button" class="preset" data-preset="${p[0]}" style="--cc:${COLS[p[4]]}">${I('plus')}${I(p[3])} ${lang==='ar'?p[1]:p[2]}</button>`).join('')}</div></div>`:''}
      <form id="catForm" class="catForm">
        <label for="fcName">${L('newType')}<input id="fcName" required placeholder="${L('typePh')}"></label>
        <div class="lbl">${L('icon')}<div class="days icPick">${ICPICK.map(k=>`<button type="button" data-icpick="${k}" aria-pressed="${k===newIc}" aria-label="${k}">${I(k)}</button>`).join('')}</div></div>
        <div class="lbl">${L('color')}<div class="days colPick">${Object.keys(COLS).map(k=>`<button type="button" data-colpick="${k}" aria-pressed="${k===newCol}" style="--cc:${COLS[k]}" aria-label="${k}"></button>`).join('')}</div></div>
        <div><button class="btn sun" type="submit">${I('plus')}${L('addType')}</button></div>
      </form>
      <small style="color:var(--muted)">${L('typesNote')}</small></section>
    <section class="panel glass"><h3><span class="chip study">${I('plus')}</span>${L('addTask')}</h3>
    <form id="addForm">
      <label for="fTitle">${L('fTitle')}<input id="fTitle" required placeholder="${L('fPh')}"></label>
      <label for="fCat">${L('fCat')}<select id="fCat">${S.cats.map(c=>`<option value="${c.id}">${esc(tr(c.name))}</option>`).join('')}</select></label>
      <label for="fTime">${L('fTime')}<input id="fTime" type="time" value="17:00"></label>
      <label for="fPts">${L('fPts')}<input id="fPts" type="number" min="1" max="10" value="1"></label>
      <div class="full lbl">${L('fDays')}<div class="days" id="fDays">${DAYS.map((d,i)=>`<button type="button" data-day="${i}" aria-pressed="true">${d}</button>`).join('')}</div></div>
      <div class="full lbl">${L('fKids')}<div class="days kidsPick" id="fKids"><button type="button" id="fAll" aria-pressed="true">${I('check')} ${L('allKids')}</button>${S.kids.map(k=>`<button type="button" data-k="${k.id}" aria-pressed="true">${av(k)}${kn(k)}</button>`).join('')}</div><small class="pickHint" id="fHint">${L('forAll')}</small></div>
      <div class="full"><button class="btn sun" type="submit">${I('plus')}${L('addBtn')}</button></div>
    </form></section>
    <section class="panel glass"><h3><span class="chip study">${I('clock')}</span>${L('schedule')}</h3><div class="tw"><table><thead><tr><th>${L('thTask')}</th><th>${L('thTime')}</th><th>${L('thDays')}</th><th>${L('thWho')}</th><th>${L('thPts')}</th><th></th></tr></thead><tbody>
    ${S.tasks.filter(t=>!t.fixed).sort((a,b)=>tm(a).localeCompare(tm(b))).map(t=>`<tr><td><span class="chip ${catCls(t.cat)}" style="${catSty(t.cat)}">${I(t.ic)}</span>${esc(tr(t.title))}</td><td>${fmt(tm(t))}</td><td>${t.days.length===7?L('daily'):t.days.map(d=>DAYS[d]).join(L('sep'))}</td><td>${t.kids.map(k=>kid(k)).filter(Boolean).map(kn).join(L('sep'))}</td><td>${t.points}</td><td><button class="btn no sm" data-del="${t.id}" aria-label="${L('del')}">${I('trash')}</button></td></tr>`).join('')}
    </tbody></table></div></section>`;
  }
  return `<div class="tabs"><button class="glass" data-ptab="requests" aria-pressed="${pt==='requests'}">${I('bell')}${L('requests')} ${pend.length?`(${pend.length})`:''}</button><button class="glass" data-ptab="tasks" aria-pressed="${pt==='tasks'}">${I('clock')}${L('tasksTab')}</button><button class="glass" data-ptab="rewards" aria-pressed="${pt==='rewards'}">${I('trophy')}${L('rewards')}</button><button class="glass" data-ptab="pen" aria-pressed="${pt==='pen'}">${I('star')}${L('penalties')}</button><button class="glass" data-ptab="family" aria-pressed="${pt==='family'}">${I('users')}${L('family')}</button></div>${body}`;
}
/* ---------- writes ---------- */
function approve(ls){
  const b=writeBatch(db);
  for(const l of ls){
    const pts=('quiz' in l)?jPts(l.quiz):l.reward?-(S.rewards.find(r=>r.id===l.reward)?.cost||0):l.qada?0:(task(l.task)?.points||0);
    b.update(famRef(),{['points.'+l.kid]:increment(pts)});
    b.update(doc(logsCol(),l.id),{status:'approved',by:me.uid});
  }
  return b.commit().catch(fail);
}
const setKids=kids=>famUpdate({kids});
async function makeCode(kidId){
  const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let c='';for(const x of crypto.getRandomValues(new Uint8Array(6)))c+=A[x%A.length];
  const k=kid(kidId);
  try{await setDoc(doc(db,'links',c),{fid,kid:kidId,exp:Timestamp.fromMillis(Date.now()+30*60000),by:me.uid})}catch(e){fail(e);return}
  const sh=sheet(`${av(k,'lg')}<h2>${L('codeFor',kn(k))}</h2><div class="codeShow" dir="ltr">${c}</div><p style="margin:0;color:var(--muted)">${L('codeSteps')}</p><div class="row"><button class="btn go" id="cClose">${I('check')}${L('close')}</button></div>`);
  sh.querySelector('#cClose').onclick=()=>sh.remove();
}
const devName=()=>{const u=navigator.userAgent;return /iPad/.test(u)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)?'iPad':/iPhone/.test(u)?'iPhone':/Android/.test(u)?'Android':'Web'};
let linking=false;
async function linkDevice(code){
  linking=true;gate.busy=true;render();
  try{
    if(!auth.currentUser)await signInAnonymously(auth);
    const ls=await getDoc(doc(db,'links',code));
    if(!ls.exists()||ls.data().exp.toMillis()<Date.now())throw {code:'bad'};
    const l=ls.data();
    await setDoc(doc(db,'members',auth.currentUser.uid),{fid:l.fid,role:'kid',kid:l.kid,code,dev:devName(),at:serverTimestamp()});
    linking=false;gate.busy=false;await onUser(auth.currentUser);
  }catch(e){linking=false;gate.busy=false;console.error(e);toast(e.code==='bad'||e.code==='permission-denied'?L('badCode'):L('err'));render()}
}
const authErr=e=>({'auth/invalid-credential':'errAuth','auth/wrong-password':'errAuth','auth/user-not-found':'errAuth','auth/email-already-in-use':'errInUse','auth/weak-password':'errWeak','auth/invalid-email':'errEmail'}[e.code]||'err');

/* ---------- events ---------- */
document.addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b)return;
  const d=b.dataset;
  if(b.id==='roleKid'){V.role='kid';render()}
  else if(b.id==='roleParent'){V.role='parent';render()}
  else if(b.id==='mode'){theme=isDark()?'light':'dark';try{localStorage.setItem('najmati-theme',theme)}catch(e){}applyTheme()}
  else if(b.id==='lang'){lang=lang==='ar'?'en':'ar';try{localStorage.setItem('najmati-lang',lang)}catch(e){}applyLang();render()}
  else if(b.id==='palBtn'){palOpen($('#palMenu').hidden)}
  else if(d.pal){pal=d.pal;try{localStorage.setItem('najmati-pal',pal)}catch(e){}applyPal();palOpen(false);build();placeBuddy()}
  else if(b.id==='goParent'||b.id==='tLogin'){gate.screen='login';render()}
  else if(b.id==='tSignup'){gate.screen='signup';render()}
  else if(b.id==='goKid'){gate.screen='kid';render();$('#aCode')?.focus()}
  else if(b.id==='gateBack'){gate.screen='welcome';render()}
  else if(b.id==='forgot'){const em=$('#aEmail').value.trim();if(!em){toast(L('enterEmail'));return}sendPasswordResetEmail(auth,em).then(()=>toast(L('resetSent'))).catch(e=>toast(L(authErr(e))))}
  else if(b.id==='doInstall'){deferredInstall?.prompt();deferredInstall=null;installHint()}
  else if(d.pin!==undefined){if(d.pin==='⌫')pinBuf=pinBuf.slice(0,-1);else if(pinBuf.length<4)pinBuf+=d.pin;
    if(pinBuf.length===4){if(pinBuf===kid(M.kid).pin){pinOk=true;try{sessionStorage.setItem('najmati-unlocked',M.kid)}catch(e){}pinBuf='';render();return}pinBuf='';toast(L('wrongPin'))}render()}
  else if(b.id==='logout'){signOut(auth)}
  else if(d.photo){pickPhoto(d.photo)}
  else if(d.unphoto){setKids(F.kids.map(k=>{if(k.id!==d.unphoto)return k;const {photo,...rest}=k;return rest}))}
  else if(d.linkdev){makeCode(d.linkdev)}
  else if(d.unlink){deleteDoc(doc(db,'members',d.unlink)).then(()=>toast(L('unlinked'))).catch(fail)}
  else if(d.delkid){const k=kid(d.delkid);const sh=sheet(`${av(k,'lg')}<h2>${L('delKidQ',kn(k))}</h2><div class="row"><button class="btn no" id="dkNo">${L('notYet')}</button><button class="btn go" id="dkYes" style="background:linear-gradient(180deg,var(--coral2),var(--coral))">${I('trash')}${L('delKidOk')}</button></div>`);
    sh.querySelector('#dkNo').onclick=()=>sh.remove();
    sh.querySelector('#dkYes').onclick=()=>{sh.remove();const id=k.id;
      famUpdate({kids:F.kids.filter(x=>x.id!==id),tasks:(F.tasks||[]).map(t=>({...t,kids:t.kids.filter(x=>x!==id)})).filter(t=>t.kids.length),['points.'+id]:deleteField()}).then(()=>toast(L('kidDeleted')));
      DEV.filter(x=>x.kid===id).forEach(x=>deleteDoc(doc(db,'members',x.id)).catch(()=>{}))}}
  else if(d.kid){V.kid=d.kid;render()}
  else if(d.tab){V.tab=d.tab;render();if(d.tab==='play')setTimeout(()=>document.querySelector('.wStop.here,.wStop.chest')?.scrollIntoView({block:'center',behavior:'smooth'}),80)}
  else if(d.qsec){qSec=d.qsec;try{localStorage.setItem('najmati-sec',qSec)}catch(e){}render()}
  else if(d.journey){startJourney(d.journey)}
  else if(d.qa){answerQ(b,e)}
  else if(d.qclose){closeQuiz()}
  else if(d.ptab){V.ptab=d.ptab;render()}
  else if(d.task){
    const t=task(d.task),k=kid(V.kid),l=log(t.id,k.id);
    if(t.pr&&(!l||l.status==='rejected')){const ps=prayerState(t),f=k.g==='f';if(ps.s==='locked'){toast(L('notYetTime',dur(ps.left)));return}
      const ow=owedPrayer(k.id);if(ow&&ow.id!==t.id&&ps.s!=='missed'&&PRAYERS.indexOf(ow.pr)<PRAYERS.indexOf(t.pr)){toast(L('qadaFirst',L('pn_'+ow.pr),f));return}
      if(ps.s==='missed'){const sh=sheet(`<span class="chip ${catCls(t.cat)}" style="${catSty(t.cat)}">${I(t.ic)}</span><h2>${L('qadaAsk',L('pn_'+t.pr),f)}</h2><p style="margin:0;color:var(--muted)">${L('qadaP',f)}</p>
        <div class="row"><button class="btn go" id="yes">${I('check')}${L('qadaYes',f)}</button><button class="btn no" id="notyet">${L('notYet')}</button></div>`);
        sh.querySelector('#notyet').onclick=()=>sh.remove();
        sh.querySelector('#yes').onclick=()=>{sh.remove();setDoc(doc(logsCol(),`${today()}_${k.id}_${t.id}`),{task:t.id,kid:k.id,date:today(),status:'pending',qada:true,at:now(),ts:serverTimestamp()}).catch(fail);toast(L('qadaSent'))};return}}
    if(l&&l.status!=='rejected'){toast(l.status==='pending'?L('withParent'):L('alreadyOk'));return}
    const sh=sheet(`<span class="chip ${catCls(t.cat)}" style="${catSty(t.cat)}">${I(t.ic)}</span><h2>${L('ask',esc(tr(t.title)))}</h2><p style="margin:0;color:var(--muted)">${L('askP',t.points)}</p>
      <div class="row"><button class="btn go" id="yes">${I('check')}${L('yes')}</button><button class="btn no" id="notyet">${L('notYet')}</button></div>`);
    sh.querySelector('#notyet').onclick=()=>sh.remove();
    sh.querySelector('#yes').onclick=ev=>{burst(ev.clientX,ev.clientY);sh.remove();
      setDoc(doc(logsCol(),`${today()}_${k.id}_${t.id}`),{task:t.id,kid:k.id,date:today(),status:'pending',at:now(),ts:serverTimestamp()}).catch(fail);toast(L('sent'))};
  }
  else if(d.reward){
    const r=S.rewards.find(x=>x.id===d.reward),k=kid(V.kid);
    if(k.points<r.cost){toast(L('need',r.cost-k.points));return}
    if(S.logs.some(l=>l.reward===r.id&&l.kid===k.id&&l.status==='pending')){toast(L('withParent'));return}
    addDoc(logsCol(),{reward:r.id,kid:k.id,date:today(),status:'pending',at:now(),ts:serverTimestamp()}).catch(fail);burst(e.clientX,e.clientY);toast(L('rewardSent'));
  }
  else if(d.okall){const k=kid(d.okall);approve(S.logs.filter(l=>l.kid===k.id&&l.status==='pending'));burst(e.clientX,e.clientY);toast(L('okFor',tr(k.name)))}
  else if(d.ok){const l=S.logs.find(x=>x.id===d.ok);if(!l)return;approve([l]);burst(e.clientX,e.clientY);toast(L('okFor',tr(kid(l.kid).name)))}
  else if(d.rej){updateDoc(doc(logsCol(),d.rej),{status:'rejected',by:me.uid}).catch(fail);toast(L('rejected_t'))}
  else if(d.del){famUpdate({tasks:F.tasks.filter(t=>t.id!==d.del)});toast(L('deleted'))}
  else if(d.rewic){newRewIc=d.rewic;document.querySelectorAll('[data-rewic]').forEach(x=>x.setAttribute('aria-pressed',x===b))}
  else if(b.id==='rwPhoto'){pickImage(320,img=>{const keep=[$('#rwName')?.value,$('#rwCost')?.value];newRewImg=img;render();if($('#rwName')){$('#rwName').value=keep[0]||'';$('#rwCost').value=keep[1]||20}})}
  else if(b.id==='rwNoPhoto'){const keep=[$('#rwName')?.value,$('#rwCost')?.value];newRewImg=null;render();$('#rwName').value=keep[0]||'';$('#rwCost').value=keep[1]||20}
  else if(d.rewphoto){pickImage(320,img=>famUpdate({rewards:F.rewards.map(r=>r.id===d.rewphoto?{...r,img}:r)}).then(()=>toast(L('photoSaved'))))}
  else if(d.rewunphoto){famUpdate({rewards:F.rewards.map(r=>{if(r.id!==d.rewunphoto)return r;const {img,...x}=r;return x})})}
  else if(d.delrew){famUpdate({rewards:(F.rewards||[]).filter(r=>r.id!==d.delrew)}).then(()=>toast(L('rewDeleted')))}
  else if(d.penk){penKids=penKids.includes(d.penk)?penKids.filter(x=>x!==d.penk):[...penKids,d.penk];b.setAttribute('aria-pressed',penKids.includes(d.penk))}
  else if(d.penmode){penMode=d.penmode;render()}
  else if(d.penpre){const r=$('#penReason');if(r)r.value=d.penpre}
  else if(d.unpen){const l=LPen.find(x=>x.id===d.unpen);if(!l)return;const b2=writeBatch(db);b2.delete(doc(logsCol(),l.id));b2.update(famRef(),{['points.'+l.kid]:increment(l.bonus?-l.pts:l.pts)});b2.commit().then(()=>toast(L(l.bonus?'bonUndone':'penUndone'))).catch(fail)}
  else if(d.snd){if(d.snd==='custom'&&!S.adhan.sndVer){pickSound();return}famUpdate({'adhan.snd':d.snd})}
  else if(b.id==='adUp'){pickSound()}
  else if(d.icpick){newIc=d.icpick;document.querySelectorAll('[data-icpick]').forEach(x=>x.setAttribute('aria-pressed',x===b))}
  else if(d.colpick){newCol=d.colpick;document.querySelectorAll('[data-colpick]').forEach(x=>x.setAttribute('aria-pressed',x===b))}
  else if(d.preset){const p=PRESETS.find(x=>x[0]===d.preset);famUpdate({cats:[...S.cats,{id:p[0],name:{ar:p[1],en:p[2]},ic:p[3],col:p[4]}]});toast(L('typeAdded'))}
  else if(d.delcat){const n=S.tasks.filter(t=>t.cat===d.delcat).length;if(n){toast(L('typeInUse',n));return}famUpdate({cats:S.cats.filter(c=>c.id!==d.delcat)});toast(L('typeDeleted'))}
  else if(b.id==='adOn'){famUpdate({'adhan.on':!S.adhan.on})}
  else if(d.adpr){const v=!S.adhan.pr?.[d.adpr];b.setAttribute('aria-pressed',v);famUpdate({['adhan.pr.'+d.adpr]:v})}
  else if(b.id==='adTest'){playAdhan();toast(L('playing'))}
  else if(d.crec){recToggle(d.crec)}
  else if(d.cup){upCheer(d.cup)}
  else if(d.cplay){cheer(d.cplay,'',0)}
  else if(d.cdel){delCheer(d.cdel)}
  else if(b.id==='fAll'){const on=b.getAttribute('aria-pressed')!=='true';document.querySelectorAll('#fKids [data-k]').forEach(x=>x.setAttribute('aria-pressed',on));b.setAttribute('aria-pressed',on);syncKidsPick()}
  else if(d.day!==undefined||d.k){b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')!=='true');if(d.k)syncKidsPick()}
});
document.addEventListener('change',e=>{
  if(e.target.id==='fCountry'){famUpdate({city:PLACES.find(c=>c.id===e.target.value).cities[0][0]})}
  else if(e.target.id==='fCity'){famUpdate({city:e.target.value})}
});
/* English name: filled from the Arabic one as you type, until the parent edits it */
const NAMES={'محمد':'Mohammed','أحمد':'Ahmed','احمد':'Ahmed','عبدالله':'Abdullah','عبد الله':'Abdullah','عبدالرحمن':'Abdulrahman','عبد الرحمن':'Abdulrahman','فاطمة':'Fatima','فاطمه':'Fatima','مريم':'Maryam','سارة':'Sara','ساره':'Sara','يوسف':'Yousef','عمر':'Omar','علي':'Ali','خالد':'Khalid','نورة':'Noura','نوره':'Noura','حمدان':'Hamdan','سلطان':'Sultan','فارس':'Fares','إيلاف':'Elaf','ايلاف':'Elaf','زايد':'Zayed','راشد':'Rashid','سعيد':'Saeed','حمد':'Hamad','منصور':'Mansour','ماجد':'Majid','هند':'Hind','شما':'Shamma','عائشة':'Aisha','عايشة':'Aisha','حصة':'Hessa','لطيفة':'Latifa','مهرة':'Mahra','ريم':'Reem','روضة':'Rawda','آمنة':'Amna','امنة':'Amna','خديجة':'Khadija','زينب':'Zainab','حسن':'Hassan','حسين':'Hussein','إبراهيم':'Ibrahim','ابراهيم':'Ibrahim','إسماعيل':'Ismail','اسماعيل':'Ismail','آدم':'Adam','ادم':'Adam','ياسين':'Yaseen','حمزة':'Hamza','مصطفى':'Mustafa','سيف':'Saif','ليان':'Layan','جود':'Jood','رهف':'Rahaf','لين':'Leen','دانة':'Dana','غلا':'Ghala','شهد':'Shahad','ريان':'Rayan','تميم':'Tamim','عثمان':'Othman','بلال':'Bilal','نوح':'Nooh','موسى':'Musa','عيسى':'Eisa','سلمان':'Salman','فهد':'Fahad','تركي':'Turki','ناصر':'Nasser','بدر':'Badr','جاسم':'Jassim','ميرة':'Meera','ميثاء':'Maitha','سلامة':'Salama','حور':'Hoor','جنى':'Jana','رنا':'Rana','نور':'Noor','شيخة':'Shaikha','شيخه':'Shaikha','عبدالعزيز':'Abdulaziz','عبد العزيز':'Abdulaziz'};
const TL={'ا':'a','أ':'a','إ':'i','آ':'aa','ب':'b','ت':'t','ث':'th','ج':'j','ح':'h','خ':'kh','د':'d','ذ':'dh','ر':'r','ز':'z','س':'s','ش':'sh','ص':'s','ض':'d','ط':'t','ظ':'z','ع':'a','غ':'gh','ف':'f','ق':'q','ك':'k','ل':'l','م':'m','ن':'n','ه':'h','ة':'a','و':'o','ي':'i','ى':'a','ئ':'e','ؤ':'o','ء':''};
function translit(ar){const s=String(ar||'').trim();if(!s)return '';if(NAMES[s])return NAMES[s];
  return s.split(/\s+/).map(w=>{if(NAMES[w])return NAMES[w];let o='';for(const ch of w)o+=TL[ch]??(/[a-z0-9]/i.test(ch)?ch:'');o=o.replace(/(.)\1{2,}/g,'$1$1');return o.charAt(0).toUpperCase()+o.slice(1)}).join(' ')}
document.addEventListener('input',e=>{const f=e.target.closest?.('#newKid,[data-kidform]');if(f&&e.target.name==='ar'){const en=f.querySelector('input[name=en]');if(en&&(!en.value||en.dataset.auto==='1')){en.value=translit(e.target.value);en.dataset.auto='1'}}else if(f&&e.target.name==='en')e.target.dataset.auto='0'});
document.addEventListener('input',e=>{if(e.target.id==='aCode'){const v=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'');if(v!==e.target.value)e.target.value=v}});
document.addEventListener('submit',async e=>{
  const f=e.target;
  if(f.id==='authForm'){e.preventDefault();const em=$('#aEmail').value.trim(),pw=$('#aPass').value;gate.email=em;gate.busy=true;render();
    try{if(gate.screen==='signup')await createUserWithEmailAndPassword(auth,em,pw);else await signInWithEmailAndPassword(auth,em,pw)}
    catch(err){toast(L(authErr(err)))}gate.busy=false;if(!F)render();return}
  if(f.id==='codeForm'){e.preventDefault();const c=$('#aCode').value.trim().toUpperCase();if(c.length===6)linkDevice(c);else toast(L('badCode'));return}
  if(f.dataset.kidform){e.preventDefault();const fd=new FormData(f),id=f.dataset.kidform,pin=String(fd.get('pin')||'').trim();
    if(pin&&!/^\d{4}$/.test(pin)){toast(L('pinPh'));return}
    const girl=fd.get('gender')==='g';
    setKids(F.kids.map(k=>{if(k.id!==id)return k;const look=girl?'girl':(k.look==='girl'?'boy':k.look||'boy');const n={...k,name:{ar:fd.get('ar').trim(),en:fd.get('en').trim()||translit(fd.get('ar').trim())},look,pin};if(look==='girl')n.g='f';else delete n.g;if(!pin)delete n.pin;return n})).then(()=>toast(L('saved')));
    document.activeElement?.blur();return}
  if(f.id==='newKid'){e.preventDefault();const fd=new FormData(f),nm=fd.get('ar').trim(),look=fd.get('gender')==='g'?'girl':(F.kids.filter(x=>x.look!=='girl').length%2?'boy2':'boy');if(!nm)return;
    const k={id:'k'+Date.now().toString(36),name:{ar:nm,en:String(fd.get('en')||'').trim()||translit(nm)},look};if(look==='girl')k.g='f';
    famUpdate({kids:[...F.kids,k],['points.'+k.id]:0}).then(()=>toast(L('kidAdded')));document.activeElement?.blur();return}
  if(f.id==='rewForm'){e.preventDefault();const nm=$('#rwName').value.trim(),cost=Math.max(1,Math.round(+$('#rwCost').value||1));if(!nm)return;
    famUpdate({rewards:[...(F.rewards||[]),{id:'r'+Date.now().toString(36),title:{ar:nm,en:nm},ic:newRewIc,cost,...(newRewImg?{img:newRewImg}:{})}]}).then(()=>toast(L('rewAdded')));newRewImg=null;document.activeElement?.blur();return}
  if(f.id==='penForm'){e.preventDefault();const reason=$('#penReason').value.trim(),pts=Math.max(1,Math.round(+$('#penPts').value||1));
    if(!penKids.length){toast(L('penPick'));return}if(!reason)return;
    const b=writeBatch(db),names=[];
    for(const kidId of penKids){const bon=penMode==='bonus';b.set(doc(logsCol()),{pen:true,...(bon?{bonus:true}:{}),kid:kidId,reason,pts,date:today(),at:now(),status:'approved',ts:serverTimestamp(),by:me.uid});b.update(famRef(),{['points.'+kidId]:increment(bon?pts:-pts)});names.push(tr(kid(kidId).name))}
    b.commit().catch(fail);penKids=[];toast(L(penMode==='bonus'?'bonDone':'penDone',names.join(L('sep'))));document.activeElement?.blur();render();return}
  if(f.id==='catForm'){e.preventDefault();const nm=$('#fcName').value.trim();if(!nm)return;famUpdate({cats:[...S.cats,{id:'c'+Date.now(),name:nm,ic:newIc,col:newCol}]});document.activeElement?.blur();toast(L('typeAdded'));return}
  if(f.id!=='addForm')return;
  e.preventDefault();
  const days=[...document.querySelectorAll('#fDays [aria-pressed="true"]')].map(b=>+b.dataset.day);
  const kids=[...document.querySelectorAll('#fKids [data-k][aria-pressed="true"]')].map(b=>b.dataset.k);
  if(!days.length||!kids.length){toast(L('pickOne'));return}
  const cat=$('#fCat').value;
  famUpdate({tasks:[...(F.tasks||[]),{id:'t'+Date.now(),title:$('#fTitle').value.trim(),cat,ic:catById(cat).ic,points:Math.max(1,+$('#fPts').value||1),time:$('#fTime').value||'17:00',days,kids}]});
  document.activeElement?.blur();toast(L('added'));
});
function syncKidsPick(){const ks=[...document.querySelectorAll('#fKids [data-k]')],on=ks.filter(x=>x.getAttribute('aria-pressed')==='true');$('#fAll').setAttribute('aria-pressed',on.length===ks.length);
  $('#fHint').textContent=on.length===ks.length?L('forAll'):on.length?L('forSome',on.map(x=>x.textContent.trim()).join(L('sep'))):L('pickOne')}

/* ---------- adhan alert (one shared audio context, unlocked by the first tap so it can play later) ---------- */
let adCtx=null,adOut=null;
function actx(){if(!adCtx)adCtx=new (window.AudioContext||window.webkitAudioContext)();if(adCtx.state==='suspended')adCtx.resume();return adCtx}
/* browsers only start sound after a tap; keep trying on every tap until the audio is running, and ask once for notifications */
let askedNote=false;
['pointerdown','touchend','click','keydown'].forEach(ev=>document.addEventListener(ev,()=>{try{if(!adCtx||adCtx.state!=='running')actx();
  if(!askedNote&&S.adhan?.on&&'Notification' in window&&Notification.permission==='default'){askedNote=true;Notification.requestPermission().catch(()=>{})}}catch(e){}},true));
document.addEventListener('visibilitychange',()=>{if(!document.hidden){try{actx()}catch(e){}setTimeout(adhanCheck,500)}});
function stopAdhan(){if(adOut){try{adOut.disconnect()}catch(e){}adOut=null}}
function chime(){try{const c=actx();stopAdhan();adOut=c.createGain();adOut.connect(c.destination);const out=adOut,notes=[523.25,659.25,783.99,1046.5,783.99,1046.5];let t=c.currentTime+.05;
  for(let r=0;r<2;r++){notes.forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain(),o2=c.createOscillator();o.type='sine';o2.type='triangle';o.frequency.value=f;o2.frequency.value=f*2;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.22,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+1.4);o.connect(g);o2.connect(g);g.connect(out);o.start(t);o2.start(t);o.stop(t+1.5);o2.stop(t+1.5);t+=i===notes.length-1?.9:.32})}}catch(e){}}
/* a custom sound is stored once per child (in that child's own readable log space) and cached on each device */
let sndBuf=null,sndBufV=null;
async function customBuf(){
  const v=S.adhan?.sndVer;if(!v)return null;if(sndBuf&&sndBufV===v)return sndBuf;
  let data=null;try{const c=JSON.parse(localStorage.getItem('najmati-snd')||'null');if(c&&c.v===v)data=c.d}catch(e){}
  if(!data){const kidId=M.role==='kid'?M.kid:S.kids[0]?.id;if(!kidId)return null;const s=await getDoc(doc(logsCol(),'snd_'+kidId));data=s.data()?.snd;if(!data)return null;try{localStorage.setItem('najmati-snd',JSON.stringify({v,d:data}))}catch(e){}}
  const ab=await (await fetch(data)).arrayBuffer();sndBuf=await actx().decodeAudioData(ab);sndBufV=v;return sndBuf;
}
async function playAdhan(){
  stopAdhan();
  if(S.adhan?.snd==='custom'&&S.adhan.sndVer){try{const buf=await customBuf();if(buf){const c=actx();stopAdhan();adOut=c.createGain();adOut.connect(c.destination);const src=c.createBufferSource();src.buffer=buf;src.connect(adOut);src.start();return}}catch(e){console.error(e)}}
  chime();
}
function pickSound(){const inp=document.createElement('input');inp.type='file';inp.accept='audio/*';inp.onchange=()=>{const f=inp.files[0];if(!f)return;
  if(f.size>700*1024){toast(L('sndBig'));return}
  const r=new FileReader();r.onload=async()=>{toast(L('sndSaving'));const v=Date.now(),b=writeBatch(db);
    for(const k of F.kids)b.set(doc(logsCol(),'snd_'+k.id),{kid:k.id,snd:r.result,name:f.name,date:'snd',status:'approved',v});
    b.update(famRef(),{'adhan.snd':'custom','adhan.sndName':f.name,'adhan.sndVer':v});
    try{await b.commit();try{localStorage.setItem('najmati-snd',JSON.stringify({v,d:r.result}))}catch(e){}toast(L('sndSaved'))}catch(e){fail(e)}};r.readAsDataURL(f)};inp.click()}
function showAdhan(k){const sh=sheet(`<span class="chip prayer adhanChip">${I('mosque')}</span><h2>${L('adhanNow',L('pn_'+k))}</h2><p style="margin:0;color:var(--muted);font-size:20px;font-family:var(--display)">${L('adhanSub')}</p>
  <div class="row"><button class="btn sun" id="adPlay">${I('play')}${L('playAdhan')}</button><button class="btn go" id="adOk">${I('check')}${L('adhanOk')}</button><button class="btn no" id="adStop">${I('speaker')}${L('stopSnd')}</button></div>`);
  sh.classList.add('adhanSheet');sh.querySelector('#adStop').onclick=stopAdhan;sh.querySelector('#adPlay').onclick=()=>{actx();playAdhan()};sh.querySelector('#adOk').onclick=()=>{stopAdhan();sh.remove()}}
function adhanCheck(){if(!F||!M||!S.adhan?.on||document.querySelector('.adhanSheet'))return;const p=prayerTimes(),n=nowMin(),day=today();
  let done='';try{done=localStorage.getItem('najmati-alerted')||''}catch(e){}
  for(const k of PRAYERS){if(!S.adhan.pr?.[k])continue;const st=p[k];if(n>=st&&n<st+15){const key=day+k;if(done===key)continue;try{localStorage.setItem('najmati-alerted',key)}catch(e){}playAdhan();showAdhan(k);adhanNote(k);break}}}
function adhanNote(k){try{if(navigator.vibrate)navigator.vibrate([400,200,400,200,800]);if(!document.hidden||!('Notification' in window)||Notification.permission!=='granted')return;
  navigator.serviceWorker?.getRegistration().then(r=>{const o={body:L('adhanSub'),icon:'icons/icon-192.png?v=2',badge:'icons/icon-192.png?v=2',tag:'adhan',renotify:true,vibrate:[400,200,400]};r?r.showNotification(L('adhanNow',L('pn_'+k)),o):new Notification(L('adhanNow',L('pn_'+k)),o)}).catch(()=>{})}catch(e){}}

/* ---------- sync ---------- */
let logSubs=[];
function subLogs(){
  logSubs.forEach(u=>u());logSubs=[];logDay=today();LT=[];LP=[];LPen=[];LQ=[];
  const map=s=>s.docs.map(x=>({id:x.id,...x.data()}));
  const upd=()=>{if(F){rebuild();softRender()}};
  const lerr=err=>{if(err.code!=='permission-denied')fail(err)};
  if(M.role==='kid'){logSubs.push(onSnapshot(query(logsCol(),where('kid','==',M.kid),where('date','==',logDay)),s=>{LT=map(s);upd()},lerr));
    logSubs.push(onSnapshot(query(logsCol(),where('kid','==',M.kid),where('date','==','quiz')),s=>{LQ=map(s);upd()},lerr))}
  else{
    logSubs.push(onSnapshot(query(logsCol(),where('date','==',logDay)),s=>{LT=map(s);upd()},lerr));
    logSubs.push(onSnapshot(query(logsCol(),where('status','==','pending')),s=>{LP=map(s);upd()},lerr));
    logSubs.push(onSnapshot(query(logsCol(),where('pen','==',true)),s=>{LPen=map(s);upd()},lerr));
    logSubs.push(onSnapshot(query(logsCol(),where('date','==','quiz')),s=>{LQ=map(s);autoQuiz();upd()},lerr));
  }
}
function unsubAll(){[...subs,...logSubs].forEach(u=>{try{u()}catch(e){}});subs=[];logSubs=[]}
async function createFamily(u){
  const ref=doc(collection(db,'families'));const b=writeBatch(db);
  b.set(ref,newFamily(u.uid,u.email));
  b.set(doc(db,'members',u.uid),{fid:ref.id,role:'parent',email:u.email,at:serverTimestamp()});
  await b.commit();return {fid:ref.id,role:'parent'};
}
async function onUser(u){
  unsubAll();me=u;M=null;F=null;fid=null;LT=[];LP=[];DEV=[];logDay='';
  if(!u){if(gate.screen==='loading')gate.screen='welcome';render();return}
  if(u.isAnonymous&&linking)return;
  gate.screen='loading';render();
  try{
    const ms=await getDoc(doc(db,'members',u.uid));
    let m=ms.exists()?ms.data():null;
    if(!m){if(u.isAnonymous){gate.screen='kid';await signOut(auth);return}m=await createFamily(u)}
    M=m;fid=m.fid;V.ptab='requests';V.tab='today';V.role=m.role==='kid'?'kid':'parent';if(m.role==='kid')V.kid=m.kid;
    subs.push(onSnapshot(doc(db,'members',u.uid),s=>{if(!s.exists()&&!s.metadata.fromCache){try{sessionStorage.removeItem('najmati-unlocked')}catch(e){}gate.screen='welcome';signOut(auth)}},()=>{}));
    subs.push(onSnapshot(famRef(),s=>{if(!s.exists())return;F=s.data();_pt=null;rebuild();if(logDay!==today())subLogs();softRender();if(S.adhan?.on&&S.adhan?.snd==='custom')customBuf().catch(()=>{})},err=>{console.error(err);if(err.code==='permission-denied'){gate.screen='welcome';signOut(auth)}else fail(err)}));
    if(m.role==='parent')subs.push(onSnapshot(query(collection(db,'members'),where('fid','==',fid),where('role','==','kid')),s=>{DEV=s.docs.map(x=>({id:x.id,...x.data()}));if(F)softRender()},()=>{}));
  }catch(e){console.error(e);toast(L('err'));gate.screen='welcome';try{await signOut(auth)}catch(x){}render()}
}
function tick(){if(!F)return;if(logDay!==today())subLogs();if(!document.querySelector('.sheet'))softRender()}

/* ---------- play: an adventure map of short quiz journeys ----------
   To add questions: add a journey to QZ (or a question to a journey). In each question the
   first answer is the correct one; answers are shuffled on screen. */
/* journeys belong to a section (s) and are keyed by id; the first faith journeys keep ids '0'..'5' so old progress stays */
const QN=5;
/* one star per question asked; a journey pays out once, the first time it is finished */
const QJ=id=>QZ.find(J=>J.id===String(id)),secJ=s=>QZ.filter(J=>J.s===s),qNum=id=>{const J=QJ(id);return J?secJ(J.s).indexOf(J)+1:1};
const jPts=id=>Math.min(QN,QJ(id)?.q.length||QN);
const QZ=[
 {t:{ar:'ربّي الله',en:'My Lord is Allah'},ic:'star',c:['#FFC94A','#FF8A3D'],q:[
  {q:{ar:'من ربّك؟',en:'Who is your Lord?'},a:[{ar:'الله',en:'Allah'},{ar:'الشمس',en:'The sun'},{ar:'القمر',en:'The moon'}]},
  {q:{ar:'أين الله؟',en:'Where is Allah?'},a:[{ar:'في السماء، مستوٍ على العرش',en:'Above the heavens, over the Throne'},{ar:'تحت الأرض',en:'Under the ground'},{ar:'في البحر',en:'In the sea'}]},
  {q:{ar:'من خلقك وخلق كل شيء؟',en:'Who created you and everything?'},a:[{ar:'الله',en:'Allah'},{ar:'الناس',en:'People'},{ar:'خلقنا أنفسنا',en:'We made ourselves'}]},
  {q:{ar:'كم إلهًا نعبد؟',en:'How many gods do we worship?'},a:[{ar:'إلهًا واحدًا: الله',en:'One: Allah'},{ar:'اثنين',en:'Two'},{ar:'ثلاثة',en:'Three'}]},
  {q:{ar:'ما معنى «لا إله إلا الله»؟',en:'What does "La ilaha illa Allah" mean?'},a:[{ar:'لا معبود بحقٍّ إلا الله',en:'None deserves worship but Allah'},{ar:'تحية الصباح',en:'A morning greeting'},{ar:'كلمة نقولها عند النوم فقط',en:'Something we only say at bedtime'}]}]},
 {t:{ar:'نبيّي محمد ﷺ',en:'My Prophet Muhammad ﷺ'},ic:'heart',c:['#FF8FB1','#E8457C'],q:[
  {q:{ar:'من نبيّك؟',en:'Who is your Prophet?'},a:[{ar:'محمد ﷺ',en:'Muhammad ﷺ'},{ar:'لا أعرف',en:"I don't know"},{ar:'ليس لنا نبي',en:'We have no prophet'}]},
  {q:{ar:'ما اسم والد النبي ﷺ؟',en:"What was the Prophet's ﷺ father's name?"},a:[{ar:'عبدالله',en:'Abdullah'},{ar:'أبو طالب',en:'Abu Talib'},{ar:'عبدالمطلب',en:'Abdul-Muttalib'}]},
  {q:{ar:'في أي مدينة وُلد النبي ﷺ؟',en:'In which city was the Prophet ﷺ born?'},a:[{ar:'مكة',en:'Makkah'},{ar:'المدينة',en:'Madinah'},{ar:'الطائف',en:'Taif'}]},
  {q:{ar:'من هو آخر الأنبياء؟',en:'Who is the last prophet?'},a:[{ar:'محمد ﷺ',en:'Muhammad ﷺ'},{ar:'عيسى عليه السلام',en:'Isa (Jesus)'},{ar:'إبراهيم عليه السلام',en:'Ibrahim'}]},
  {q:{ar:'ماذا نقول عندما نسمع اسم النبي محمد؟',en:"What do we say when we hear the Prophet's name?"},a:[{ar:'صلى الله عليه وسلم',en:'Peace and blessings be upon him'},{ar:'صباح الخير',en:'Good morning'},{ar:'لا نقول شيئًا',en:'Nothing'}]}]},
 {t:{ar:'ديني الإسلام',en:'My religion is Islam'},ic:'mosque',c:['#5FD3A0','#1FA67A'],q:[
  {q:{ar:'ما دينك؟',en:'What is your religion?'},a:[{ar:'الإسلام',en:'Islam'},{ar:'لا دين لي',en:'None'},{ar:'لا أعرف',en:"I don't know"}]},
  {q:{ar:'كم عدد أركان الإسلام؟',en:'How many pillars of Islam are there?'},a:[{ar:'خمسة',en:'Five'},{ar:'ستة',en:'Six'},{ar:'ثلاثة',en:'Three'}]},
  {q:{ar:'ما الركن الأول من أركان الإسلام؟',en:'What is the first pillar of Islam?'},a:[{ar:'الشهادتان',en:'The two testimonies'},{ar:'الصوم',en:'Fasting'},{ar:'الحج',en:'Hajj'}]},
  {q:{ar:'كم صلاةً نصلي في اليوم والليلة؟',en:'How many prayers do we pray each day?'},a:[{ar:'خمس صلوات',en:'Five'},{ar:'ثلاث صلوات',en:'Three'},{ar:'سبع صلوات',en:'Seven'}]},
  {q:{ar:'في أي شهر يصوم المسلمون؟',en:'In which month do Muslims fast?'},a:[{ar:'رمضان',en:'Ramadan'},{ar:'شعبان',en:"Sha'ban"},{ar:'شوّال',en:'Shawwal'}]}]},
 {t:{ar:'أركان الإيمان',en:'Pillars of faith'},ic:'sparkle',c:['#9B7BFF','#5A3BE0'],q:[
  {q:{ar:'كم عدد أركان الإيمان؟',en:'How many pillars of faith are there?'},a:[{ar:'ستة',en:'Six'},{ar:'خمسة',en:'Five'},{ar:'أربعة',en:'Four'}]},
  {q:{ar:'أيّ هذه من أركان الإيمان؟',en:'Which of these is a pillar of faith?'},a:[{ar:'الإيمان بالملائكة',en:'Belief in the angels'},{ar:'الصوم',en:'Fasting'},{ar:'الزكاة',en:'Zakat'}]},
  {q:{ar:'من الملَك الذي نزل بالوحي على الأنبياء؟',en:'Which angel brought revelation to the prophets?'},a:[{ar:'جبريل عليه السلام',en:'Jibril'},{ar:'ميكائيل عليه السلام',en:'Mikail'},{ar:'إسرافيل عليه السلام',en:'Israfil'}]},
  {q:{ar:'ما الكتاب الذي أنزله الله على محمد ﷺ؟',en:'Which book did Allah reveal to Muhammad ﷺ?'},a:[{ar:'القرآن الكريم',en:'The Quran'},{ar:'التوراة',en:'The Torah'},{ar:'الإنجيل',en:'The Injil'}]},
  {q:{ar:'ما الركن السادس من أركان الإيمان؟',en:'What is the sixth pillar of faith?'},a:[{ar:'الإيمان بالقدر خيره وشره',en:'Belief in divine decree, good and bad'},{ar:'صيام رمضان',en:'Fasting Ramadan'},{ar:'الصدقة',en:'Charity'}]}]},
 {t:{ar:'القرآن والسنة',en:'Quran and Sunnah'},ic:'book',c:['#4FC3F7','#1E7FD0'],q:[
  {q:{ar:'ما مرجعنا في ديننا؟',en:'What do we follow in our religion?'},a:[{ar:'القرآن والسنة',en:'The Quran and the Sunnah'},{ar:'ما يقوله أي أحد',en:'Whatever anyone says'},{ar:'الرسوم المتحركة',en:'Cartoons'}]},
  {q:{ar:'ما أعظم سورة في القرآن؟',en:'What is the greatest surah of the Quran?'},a:[{ar:'سورة الفاتحة',en:'Al-Fatiha'},{ar:'سورة الناس',en:'An-Nas'},{ar:'سورة الكوثر',en:'Al-Kawthar'}]},
  {q:{ar:'كم عدد سور القرآن الكريم؟',en:'How many surahs are in the Quran?'},a:[{ar:'114 سورة',en:'114'},{ar:'100 سورة',en:'100'},{ar:'30 سورة',en:'30'}]},
  {q:{ar:'أيّ سورة تعدل ثلث القرآن؟',en:'Which surah equals a third of the Quran?'},a:[{ar:'سورة الإخلاص',en:'Al-Ikhlas'},{ar:'سورة الفلق',en:'Al-Falaq'},{ar:'سورة الكوثر',en:'Al-Kawthar'}]},
  {q:{ar:'ما آخر سورة في المصحف؟',en:'What is the last surah in the Quran?'},a:[{ar:'سورة الناس',en:'An-Nas'},{ar:'سورة الفلق',en:'Al-Falaq'},{ar:'سورة الإخلاص',en:'Al-Ikhlas'}]}]},
 {t:{ar:'أحبّ الله',en:'I love Allah'},ic:'moon',c:['#FFB547','#F0569F'],q:[
  {q:{ar:'لماذا خلقنا الله؟',en:'Why did Allah create us?'},a:[{ar:'لنعبده وحده',en:'To worship Him alone'},{ar:'لنلعب فقط',en:'Only to play'},{ar:'لننام فقط',en:'Only to sleep'}]},
  {q:{ar:'من ندعو ونسأل إذا احتجنا شيئًا؟',en:'Who do we ask when we need something?'},a:[{ar:'الله وحده',en:'Allah alone'},{ar:'الشجرة',en:'A tree'},{ar:'النجوم',en:'The stars'}]},
  {q:{ar:'على من نتوكّل؟',en:'Who do we put our trust in?'},a:[{ar:'على الله',en:'Allah'},{ar:'على الحظ',en:'Luck'},{ar:'على التمائم',en:'Charms'}]},
  {q:{ar:'من يعلم ما في قلوبنا؟',en:'Who knows what is in our hearts?'},a:[{ar:'الله',en:'Allah'},{ar:'لا أحد',en:'Nobody'},{ar:'صديقي',en:'My friend'}]},
  {q:{ar:'ما أعظم ذنب يجب أن نبتعد عنه؟',en:'What is the greatest sin to stay away from?'},a:[{ar:'الشرك بالله',en:'Associating partners with Allah'},{ar:'النوم مبكرًا',en:'Sleeping early'},{ar:'شرب الماء',en:'Drinking water'}]}]}
];
QZ.forEach((J,i)=>{J.id??=String(i);J.s??='aq'});
Object.assign(T.ar,{play:'العب',jDone:(n,t)=>`${n} من ${t} رحلات`,advTitle:'مغامرة العقيدة',advOf:n=>`مغامرة ${n}`,secPick:'اختر القسم',advP:'أكمل الرحلات واجمع النجوم',
  journey:n=>`الرحلة ${n}`,qOf:(i,n)=>`السؤال ${i} من ${n}`,tryAgain:f=>f?'لا بأس، حاولي مرة أخرى!':'لا بأس، حاول مرة أخرى!',qGo:f=>f?'اختاري الإجابة الصحيحة!':'اختر الإجابة الصحيحة!',qNext:'السؤال التالي، هيّا!',jLocked:'أكمل الرحلة التي قبلها أولاً',
  jWin:'أنهيت الرحلة!',jStars:n=>`+${n} نجوم أُضيفت لرصيدك`,jWait:'النجوم في الطريق، تصل عندما يفتح ولي الأمر التطبيق',jReplay:'لعبتها من قبل، أحسنت على المراجعة!',
  nextJ:'الرحلة التالية',toMap:'الخريطة',allDone:'أنهيت كل رحلات هذا القسم! جرّب قسمًا آخر',onWay:'في الطريق',
  praise:['أحسنت! بارك الله فيك','ممتاز! ما شاء الله','أحسنت يا بطل!','بارك الله فيك!','إجابة صحيحة، أحسنت!','ما شاء الله عليك!'],praiseF:['أحسنتِ! بارك الله فيكِ','ممتازة! ما شاء الله','أحسنتِ يا بطلة!','بارك الله فيكِ!','إجابة صحيحة، أحسنتِ!','ما شاء الله عليكِ!']});
Object.assign(T.en,{play:'Play',jDone:(n,t)=>`${n} of ${t} journeys`,advTitle:'Faith adventure',advOf:n=>`${n} adventure`,secPick:'Pick a section',advP:'Finish journeys and collect stars',
  journey:n=>`Journey ${n}`,qOf:(i,n)=>`Question ${i} of ${n}`,tryAgain:"That's okay, try again!",qGo:()=>'Pick the right answer!',qNext:'Next question, let\'s go!',jLocked:'Finish the journey before it first',
  jWin:'Journey complete!',jStars:n=>`+${n} stars added to your jar`,jWait:'Your stars are on the way; they arrive when a parent opens the app',jReplay:'You played this before. Great review!',
  nextJ:'Next journey',toMap:'Map',allDone:'You finished this section! Try another one',onWay:'On the way',
  praise:['Well done!','Excellent!','Super star!','Amazing!','Correct!','You rock!'],praiseF:['Well done!','Excellent!','Super star!','Amazing!','Correct!','You rock!']});

let LQ=[],qAuto=new Set();
const qLog=(kidId,j)=>LQ.find(l=>l.id===`quiz_${kidId}_${j}`&&l.kid===kidId);
const qBest=(kidId,j)=>{try{return +localStorage.getItem(`najmati-q-${kidId}-${j}`)||0}catch(e){return 0}};
const qOpen=(kidId,id)=>{const J=QJ(id);if(!J)return false;const l=secJ(J.s),i=l.indexOf(J);return i===0||!!qLog(kidId,l[i-1].id)};

/* sounds: short synthesized cheers, no files to load */
function qTone(seq,type='triangle',vol=.18){try{const c=actx(),t0=c.currentTime;seq.forEach(([f,at,len])=>{const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=f;
  g.gain.setValueAtTime(0,t0+at);g.gain.linearRampToValueAtTime(vol,t0+at+.02);g.gain.exponentialRampToValueAtTime(.001,t0+at+len);o.connect(g).connect(c.destination);o.start(t0+at);o.stop(t0+at+len+.05)})}catch(e){}}
const sndOk=()=>qTone([[523,0,.18],[659,.09,.18],[784,.18,.2],[1047,.28,.35]]);
const sndNo=()=>qTone([[330,0,.2],[262,.16,.3]],'sine',.15);
const sndWin=()=>qTone([[523,0,.2],[659,.12,.2],[784,.24,.2],[1047,.36,.25],[784,.6,.15],[1047,.72,.6],[1319,.72,.6]]);
/* speak only with a voice in the app's language; if the device has none, stay silent rather than read Arabic with an English voice */
let voices=[];const loadVoices=()=>{try{voices=speechSynthesis.getVoices()}catch(e){}};loadVoices();try{speechSynthesis.addEventListener('voiceschanged',loadVoices)}catch(e){}
function say(txt){try{if(!voices.length)loadVoices();const want=lang==='ar'?/^ar/i:/^en/i;const v=voices.find(x=>want.test(x.lang)&&x.localService)||(lang==='ar'?null:voices.find(x=>want.test(x.lang)));if(!v)return;
  const u=new SpeechSynthesisUtterance(txt);u.voice=v;u.lang=v.lang;u.rate=lang==='ar'?.95:1.05;u.pitch=1.25;speechSynthesis.cancel();speechSynthesis.speak(u)}catch(e){}}
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const r=Math.floor(Math.random()*(i+1));[a[i],a[r]]=[a[r],a[i]]}return a};

let QS=null;
function startJourney(j){
  const k=kid(V.kid),J=QJ(j);if(!k||!J)return;j=J.id;
  if(!qOpen(k.id,j)){sndNo();toast(L('jLocked'));return}
  QS={j,i:0,miss:0,k:k.id,lock:false,ord:shuffle(J.q.map((_,x)=>x)).slice(0,QN)};preloadCheers(k.id);
  document.querySelector('.quizScr')?.remove();
  const el=document.createElement('div');el.className='quizScr';el.dir=lang==='ar'?'rtl':'ltr';document.body.appendChild(el);
  drawQ();
}
function drawQ(){
  const el=document.querySelector('.quizScr');if(!el||!QS)return;
  const J=QJ(QS.j),Q=J.q[QS.ord[QS.i]],k=kid(QS.k),n=QS.ord.length;
  const ans=shuffle(Q.a.map((a,x)=>({a,x})));
  const w=WW[pal]||WW.royal;el.className='quizScr w-'+pal;el.style.setProperty('--s1',w.sky[0]);el.style.setProperty('--s2',w.sky[1]);el.style.setProperty('--acc',w.acc);
  const qb=QB[pal]||QB.royal;el.classList.add('qB');
  el.innerHTML=`${QSCENE}<div class="qTop"><button class="ico qClose" data-qclose="1" aria-label="${L('toMap')}">${I('x')}</button>
    <div class="qDots">${QS.ord.map((_,x)=>`<i class="${x<QS.i?'on':x===QS.i?'cur':''}"></i>`).join('')}</div><span class="qStarN" id="qStarN">${I('star')}<bdi dir="ltr">${QS.i}/${n}</bdi></span><span class="qMe">${k?av(k):''}</span></div>
    <div class="qStage"><span class="wBd idle">${wBuddy('idle')}</span><div class="qPraise" aria-live="polite">${QS.i?L('qNext'):L('qGo',k?.g==='f')}</div></div>
    <div class="qBoard" style="--r1:${qb.r[0]};--r2:${qb.r[1]}"><span class="qRib">${esc(tr(SECS[J.s].t))} · ${L('journey',qNum(J.id))} · ${L('qOf',QS.i+1,n)}</span><div><h2>${esc(tr(Q.q))}</h2></div></div>
    <div class="qAns">${ans.map((o,n)=>`<button class="qA" data-qa="${o.x}" style="--g1:${qb.g[n][0]};--g2:${qb.g[n][1]};--g3:${qb.g[n][2]}"><span class="qL">${(lang==='ar'?'أبج':'ABC')[n]}</span><span>${esc(tr(o.a))}</span></button>`).join('')}</div>`;
}
function answerQ(btn,e){
  if(!QS||QS.lock)return;const k=kid(QS.k),pr=document.querySelector('.qPraise');
  if(btn.dataset.qa==='0'){
    QS.lock=true;btn.classList.add('right');btn.parentElement.classList.add('solved');sndOk();const r=btn.getBoundingClientRect();burst(r.left+r.width/2,r.top+r.height/2);flyStar(r);
    const ps=L(k?.g==='f'?'praiseF':'praise'),p=ps[Math.floor(Math.random()*ps.length)];pr.textContent=p;pr.className='qPraise show';setMood('happy');cheer('ok',p);
    setTimeout(()=>{if(!QS)return;QS.lock=false;QS.i++;if(QS.i<QS.ord.length)drawQ();else finishJ()},1300);
  }else{
    QS.miss++;btn.classList.add('wrong');btn.disabled=true;sndNo();pr.textContent=L('tryAgain',k?.g==='f');pr.className='qPraise show no';setMood('sad');cheer('no',L('tryAgain',k?.g==='f'));
    if(navigator.vibrate)navigator.vibrate(120);
  }
}
function finishJ(){
  const el=document.querySelector('.quizScr');if(!el||!QS)return;
  const {j,k:kidId,miss}=QS,k=kid(kidId),J=QJ(j),stars=miss===0?3:miss<=2?2:1;
  try{if(stars>qBest(kidId,j))localStorage.setItem(`najmati-q-${kidId}-${j}`,stars)}catch(e){}
  const first=!qLog(kidId,j),id=`quiz_${kidId}_${j}`,rec={quiz:j,kid:kidId,date:'quiz',day:today(),at:now(),miss,ts:serverTimestamp()};
  if(first){
    const n=jPts(j),b=writeBatch(db);
    b.update(famRef(),{['points.'+kidId]:increment(n),[`qz.${kidId}_${j}`]:true});
    b.set(doc(logsCol(),id),{...rec,pts:n,status:'approved',...(M.role==='parent'?{by:me.uid}:{})});
    /* older family rules only let a child send a request; then the parent's app pays the stars */
    b.commit().catch(e=>{if(M.role==='kid'&&e.code==='permission-denied'){setDoc(doc(logsCol(),id),{...rec,status:'pending'}).catch(fail);const w=document.querySelector('.qWait');if(w)w.hidden=false}else fail(e)});
  }
  const sl=secJ(J.s),more=sl[sl.indexOf(J)+1];
  el.className='quizScr w-'+pal;el.innerHTML=`<div class="qWin"><div class="qWinStars">${[1,2,3].map(s=>`<i class="${s<=stars?'on':''}" style="--d:${s*.18}s">${I('star')}</i>`).join('')}</div>
    <span class="wBd happy big">${wBuddy('happy')}</span><h2>${L('jWin')}</h2><p class="qJ">${esc(tr(J.t))}</p>
    ${first?`<p class="qGain">${I('star')} ${L('jStars',jPts(j))}</p><small class="qWait" hidden>${L('jWait')}</small>`:`<p>${L('jReplay')}</p>`}
    <div class="row">${more?`<button class="btn go" data-journey="${more?.id}">${L('nextJ')}</button>`:`<p>${L('allDone')}</p>`}<button class="btn" data-qclose="1">${L('toMap')}</button></div></div>`;
  sndWin();cheer('win',L('jWin'),600);
  for(let n=0;n<4;n++)setTimeout(()=>burst(innerWidth*(.2+.6*Math.random()),innerHeight*(.25+.3*Math.random())),n*250);
  QS=null;if(F){rebuild();softRender()}
}
function closeQuiz(){QS=null;document.querySelector('.quizScr')?.remove();try{speechSynthesis.cancel()}catch(e){}render()}

/* a parent's open app turns finished journeys into stars, once each */
function autoQuiz(){
  if(M?.role!=='parent')return;
  const ls=LQ.filter(l=>l.status==='pending'&&l.id===`quiz_${l.kid}_${l.quiz}`&&kid(l.kid)&&!qAuto.has(l.id));
  if(!ls.length)return;ls.forEach(l=>qAuto.add(l.id));approve(ls);
}

function flyStar(r){const t=document.getElementById('qStarN');if(!t)return;const e=document.createElement('span');e.className='flyStar';e.innerHTML=I('star');
  const tr=t.getBoundingClientRect();e.style.left=(r.left+r.width/2-22)+'px';e.style.top=(r.top+r.height/2-22)+'px';document.body.appendChild(e);
  requestAnimationFrame(()=>{e.style.transform=`translate(${tr.left+tr.width/2-(r.left+r.width/2)}px,${tr.top+tr.height/2-(r.top+r.height/2)}px) scale(.5)`;e.style.opacity='.9'});
  setTimeout(()=>{e.remove();if(QS){t.querySelector('bdi').textContent=`${QS.i+1}/${QS.ord.length}`;t.classList.remove('bump');void t.offsetWidth;t.classList.add('bump')}},650)}
/* ---------- play: more adventure sections ----------
   Each section has journeys of six questions; a play asks five of them in a random order.
   Rows are [question ar, question en, [right ar, right en], [wrong ar, wrong en], [wrong ar, wrong en]].
   Journey ids must stay the same once published, since progress is stored under them. */
const SECS={
  aq:{t:{ar:'العقيدة',en:'Faith'},ic:'star',c:['#FFC94A','#FF8A3D']},
  fq:{t:{ar:'الفقه',en:'Fiqh'},ic:'book',c:['#7CC6FF','#2F6BFF']},
  sl:{t:{ar:'آداب الصلاة',en:'Prayer manners'},ic:'mosque',c:['#B49BFF','#7A4DFF']},
  th:{t:{ar:'الطهارة',en:'Purity'},ic:'drop',c:['#6EE7F9','#0EA5C6']},
  ak:{t:{ar:'الأخلاق',en:'Good manners'},ic:'heart',c:['#FF9AC2','#F0457A']},
  qr:{t:{ar:'علوم القرآن',en:'The Quran'},ic:'sparkle',c:['#7BE495','#21B26B']}
};
const QX={
fq:[
 [['أركان الإسلام','Pillars of Islam'],'star',[
  ['كم عدد أركان الإسلام؟','How many pillars does Islam have?',['خمسة','Five'],['ثلاثة','Three'],['سبعة','Seven']],
  ['ما الركن الأول من أركان الإسلام؟','What is the first pillar of Islam?',['الشهادتان','The two testimonies'],['الصيام','Fasting'],['الحج','Hajj']],
  ['كم صلاة فرضها الله علينا في اليوم والليلة؟','How many prayers did Allah make due each day and night?',['خمس صلوات','Five prayers'],['صلاتان','Two prayers'],['عشر صلوات','Ten prayers']],
  ['في أي شهر يصوم المسلمون؟','In which month do Muslims fast?',['رمضان','Ramadan'],['شعبان','Shaban'],['شوال','Shawwal']],
  ['في أي مدينة يحج المسلمون؟','In which city do Muslims perform Hajj?',['مكة المكرمة','Makkah'],['القاهرة','Cairo'],['دمشق','Damascus']],
  ['ما الركن الذي نعطي فيه جزءًا من المال للفقراء؟','Which pillar means giving part of our money to the poor?',['الزكاة','Zakah'],['الصيام','Fasting'],['الحج','Hajj']]]],
 [['الصيام','Fasting'],'moon',[
  ['متى يبدأ الصائم الإمساك عن الطعام؟','When does a fasting person stop eating?',['عند طلوع الفجر','At dawn (Fajr)'],['عند الظهر','At noon'],['عند العصر','At Asr']],
  ['متى يفطر الصائم؟','When does a fasting person break the fast?',['عند غروب الشمس','At sunset'],['عند العصر','At Asr'],['عند منتصف الليل','At midnight']],
  ['ما اسم الوجبة التي نأكلها قبل الفجر في رمضان؟','What is the meal before dawn in Ramadan called?',['السحور','Suhoor'],['الغداء','Lunch'],['العشاء','Dinner']],
  ['ماذا يفعل الصائم إذا أكل وهو ناسٍ؟','What does a fasting person do if they ate by forgetting?',['يكمل صومه','Carries on fasting'],['يفطر بقية اليوم','Stops fasting for the day'],['يصوم يومين','Fasts two days']],
  ['ما العيد الذي يأتي بعد رمضان؟','Which Eid comes after Ramadan?',['عيد الفطر','Eid al-Fitr'],['عيد الأضحى','Eid al-Adha'],['لا يوجد عيد','There is no Eid']],
  ['بماذا يُستحب أن يفطر الصائم؟','What is it sunnah to break the fast with?',['التمر','Dates'],['الحلوى','Sweets'],['المشروبات الغازية','Fizzy drinks']]]],
 [['الزكاة والصدقة','Zakah and charity'],'gift',[
  ['ما الزكاة التي نخرجها قبل صلاة عيد الفطر؟','Which zakah do we give before the Eid al-Fitr prayer?',['زكاة الفطر','Zakat al-Fitr'],['زكاة الذهب','Zakah on gold'],['زكاة الزرع','Zakah on crops']],
  ['لمن نعطي الصدقة؟','Who do we give charity to?',['للفقراء والمحتاجين','The poor and needy'],['للأغنياء فقط','Only the rich'],['لا نعطي أحدًا','Nobody']],
  ['هل الابتسامة في وجه أخيك صدقة؟','Is smiling at your brother a charity?',['نعم','Yes'],['لا','No'],['فقط في رمضان','Only in Ramadan']],
  ['ماذا تفعل الصدقة بمال المسلم؟','What does charity do to a Muslim\'s money?',['يبارك الله فيه','Allah blesses it'],['يضيع كله','It is all lost'],['لا شيء','Nothing']],
  ['إزالة الأذى عن الطريق، ما هي؟','Removing something harmful from the road is…',['صدقة','A charity'],['لعب','Just play'],['لا أجر فيها','Without reward']],
  ['أي اليدين خير؟','Which hand is better?',['اليد العليا التي تعطي','The upper hand that gives'],['اليد السفلى التي تأخذ','The lower hand that takes'],['لا فرق','No difference']]]],
 [['الحج والعمرة','Hajj and Umrah'],'mosque',[
  ['ما اسم البيت الذي يطوف حوله الحجاج؟','What is the house that pilgrims walk around?',['الكعبة','The Kaaba'],['المسجد الأقصى','Al-Aqsa Mosque'],['قصر كبير','A big palace']],
  ['كم شوطًا يطوف المسلم حول الكعبة؟','How many rounds around the Kaaba?',['سبعة أشواط','Seven'],['ثلاثة أشواط','Three'],['عشرة أشواط','Ten']],
  ['أين يقف الحجاج في اليوم التاسع من ذي الحجة؟','Where do pilgrims stand on the 9th of Dhul-Hijjah?',['عرفة','Arafah'],['جبل أحد','Mount Uhud'],['جبل الطور','Mount Sinai']],
  ['ما العيد الذي يكون في أيام الحج؟','Which Eid is during the days of Hajj?',['عيد الأضحى','Eid al-Adha'],['عيد الفطر','Eid al-Fitr'],['لا يوجد عيد','There is no Eid']],
  ['ماذا يلبس الرجل في الحج؟','What does a man wear for Hajj?',['ملابس الإحرام البيضاء','White ihram clothes'],['ملابس ملونة','Colourful clothes'],['بدلة رسمية','A suit']],
  ['بين أي جبلين يسعى الحاج؟','Between which two hills does the pilgrim walk?',['الصفا والمروة','Safa and Marwah'],['أحد وثور','Uhud and Thawr'],['عرفة ومنى','Arafah and Mina']]]],
 [['آداب الطعام','Table manners'],'plate',[
  ['ماذا نقول قبل أن نأكل؟','What do we say before eating?',['بسم الله','Bismillah'],['لا شيء','Nothing'],['صباح الخير','Good morning']],
  ['بأي يد نأكل؟','Which hand do we eat with?',['باليمين','The right hand'],['بالشمال','The left hand'],['لا فرق','It does not matter']],
  ['ماذا نقول بعد أن ننتهي من الطعام؟','What do we say after eating?',['الحمد لله','Alhamdulillah'],['وداعًا','Goodbye'],['لا شيء','Nothing']],
  ['أي لحم حرّمه الله علينا؟','Which meat did Allah forbid?',['لحم الخنزير','Pork'],['لحم الغنم','Lamb'],['لحم الدجاج','Chicken']],
  ['ماذا نفعل إذا لم يعجبنا الطعام؟','What do we do if we do not like the food?',['نتركه ولا نعيبه','Leave it without criticising'],['نقول إنه سيئ','Say it is bad'],['نرميه على الأرض','Throw it on the floor']],
  ['هل نرمي الطعام الزائد ونسرف فيه؟','Should we waste extra food?',['لا، الله لا يحب المسرفين','No, Allah does not love wasters'],['نعم','Yes'],['إذا كان كثيرًا','If there is a lot']]]],
 [['الجمعة والأعياد','Friday and Eid'],'sun',[
  ['ما أفضل يوم في الأسبوع؟','What is the best day of the week?',['يوم الجمعة','Friday'],['يوم السبت','Saturday'],['يوم الاثنين','Monday']],
  ['ما الصلاة الخاصة بيوم الجمعة؟','Which prayer is special to Friday?',['صلاة الجمعة','Jumuah prayer'],['صلاة العيد','Eid prayer'],['صلاة الكسوف','Eclipse prayer']],
  ['ما السورة التي يُستحب قراءتها يوم الجمعة؟','Which surah is it sunnah to read on Friday?',['سورة الكهف','Surat al-Kahf'],['سورة النبأ','Surat an-Naba'],['سورة الملك','Surat al-Mulk']],
  ['كم عيدًا للمسلمين في السنة؟','How many Eids do Muslims have a year?',['عيدان','Two'],['ثلاثة','Three'],['عيد واحد','One']],
  ['ماذا يقول المسلم لأخيه في العيد؟','What does a Muslim say to another on Eid?',['تقبّل الله منا ومنكم','May Allah accept from us and you'],['تصبح على خير','Good night'],['لا شيء','Nothing']],
  ['ماذا نفعل قبل صلاة الجمعة؟','What do we do before the Friday prayer?',['نغتسل ونلبس أحسن الثياب','Bathe and wear our best clothes'],['ننام حتى العصر','Sleep until Asr'],['نلعب في الشارع','Play in the street']]]]],
sl:[
 [['الأذان','The call to prayer'],'speaker',[
  ['ماذا نفعل عندما نسمع الأذان؟','What do we do when we hear the adhan?',['نردد مثل المؤذن','Repeat after the caller'],['نتكلم بصوت عالٍ','Talk loudly'],['نرفع صوت التلفاز','Turn up the TV']],
  ['بماذا يبدأ الأذان؟','How does the adhan begin?',['الله أكبر','Allahu Akbar'],['السلام عليكم','Assalamu alaikum'],['صباح الخير','Good morning']],
  ['ماذا نقول عندما يقول المؤذن «حيّ على الصلاة»؟','What do we say when the caller says "Hayya alas-salah"?',['لا حول ولا قوة إلا بالله','La hawla wa la quwwata illa billah'],['آمين','Ameen'],['شكرًا','Thank you']],
  ['ما اسم من يرفع الأذان؟','What is the person who calls the adhan called?',['المؤذن','The muezzin'],['الحارس','The guard'],['البائع','The seller']],
  ['ما اسم النداء الذي يكون قبل بدء الصلاة مباشرة؟','What is the call right before the prayer starts?',['الإقامة','The iqamah'],['الخطبة','The sermon'],['التسليم','The salam']],
  ['ماذا نسمع زيادة في أذان الفجر؟','What extra words are in the Fajr adhan?',['الصلاة خير من النوم','Prayer is better than sleep'],['حان وقت الإفطار','Time for breakfast'],['استيقظوا للمدرسة','Wake up for school']]]],
 [['الذهاب إلى المسجد','Going to the mosque'],'mosque',[
  ['بأي رجل ندخل المسجد؟','Which foot do we enter the mosque with?',['اليمنى','The right'],['اليسرى','The left'],['نقفز بالرجلين','Jump with both']],
  ['بأي رجل نخرج من المسجد؟','Which foot do we leave the mosque with?',['اليسرى','The left'],['اليمنى','The right'],['نقفز بالرجلين','Jump with both']],
  ['ماذا نصلي إذا دخلنا المسجد قبل أن نجلس؟','What do we pray when we enter the mosque before sitting?',['ركعتين تحية المسجد','Two rakahs to greet the mosque'],['لا شيء','Nothing'],['عشر ركعات','Ten rakahs']],
  ['كيف نمشي إلى الصلاة؟','How do we walk to the prayer?',['بهدوء وسكينة','Calmly'],['نركض ونتدافع','Run and push'],['نصرخ في الطريق','Shout on the way']],
  ['ماذا لا نأكل قبل المسجد حتى لا نؤذي المصلين برائحته؟','What do we not eat before the mosque so the smell does not bother others?',['الثوم والبصل النيء','Raw garlic and onion'],['التمر','Dates'],['التفاح','Apples']],
  ['ماذا نفعل بالجوال في المسجد؟','What do we do with a phone in the mosque?',['نطفئ صوته','Put it on silent'],['نلعب به','Play games on it'],['نرفع صوته','Turn the sound up']]]],
 [['قبل الصلاة','Before the prayer'],'clock',[
  ['ماذا نفعل قبل الصلاة لنكون طاهرين؟','What do we do before prayer to be pure?',['نتوضأ','Make wudu'],['نأكل','Eat'],['ننام','Sleep']],
  ['إلى أي جهة نتجه في الصلاة؟','Which way do we face in prayer?',['القبلة نحو الكعبة','The qiblah, towards the Kaaba'],['أي جهة','Any way'],['نحو الشمس','Towards the sun']],
  ['ماذا نلبس للصلاة؟','What do we wear for prayer?',['ثيابًا نظيفة ساترة','Clean, covering clothes'],['ثيابًا متسخة','Dirty clothes'],['ملابس السباحة','Swimwear']],
  ['هل نمرّ من أمام من يصلي؟','Do we walk in front of someone praying?',['لا، نبتعد عن المرور أمامه','No, we keep from passing in front'],['نعم','Yes'],['نركض أمامه','Run in front']],
  ['بماذا نبدأ الصلاة؟','How do we start the prayer?',['بقول الله أكبر','By saying Allahu Akbar'],['بقول السلام عليكم','By saying Assalamu alaikum'],['بالتصفيق','By clapping']],
  ['كيف يصلي المريض الذي لا يستطيع القيام؟','How does a sick person who cannot stand pray?',['يصلي جالسًا','Sitting down'],['يترك الصلاة','Skips the prayer'],['يصلي غدًا','Prays tomorrow']]]],
 [['داخل الصلاة','Inside the prayer'],'heart',[
  ['ما السورة التي نقرؤها في كل ركعة؟','Which surah do we read in every rakah?',['الفاتحة','Al-Fatihah'],['الناس','An-Nas'],['الكوثر','Al-Kawthar']],
  ['ماذا نقول في الركوع؟','What do we say in ruku (bowing)?',['سبحان ربي العظيم','Subhana rabbiyal-azeem'],['سبحان ربي الأعلى','Subhana rabbiyal-ala'],['آمين','Ameen']],
  ['ماذا نقول في السجود؟','What do we say in sujood?',['سبحان ربي الأعلى','Subhana rabbiyal-ala'],['سبحان ربي العظيم','Subhana rabbiyal-azeem'],['بسم الله','Bismillah']],
  ['أين ننظر ونحن نصلي؟','Where do we look while praying?',['إلى موضع السجود','At the place of sujood'],['يمينًا ويسارًا','Right and left'],['إلى السقف','At the ceiling']],
  ['كيف ننهي الصلاة؟','How do we finish the prayer?',['بالتسليم يمينًا ويسارًا','With salam to the right and left'],['بالتصفيق','By clapping'],['بالركض','By running off']],
  ['ماذا نقول بعد أن يقرأ الإمام «ولا الضالين»؟','What do we say after the imam reads "wa lad-dalleen"?',['آمين','Ameen'],['شكرًا','Thank you'],['لا شيء أبدًا','Never anything']]]],
 [['عدد الركعات','How many rakahs'],'list',[
  ['كم ركعة صلاة الفجر؟','How many rakahs is Fajr?',['ركعتان','Two'],['أربع','Four'],['ثلاث','Three']],
  ['كم ركعة صلاة المغرب؟','How many rakahs is Maghrib?',['ثلاث','Three'],['ركعتان','Two'],['أربع','Four']],
  ['كم ركعة صلاة الظهر؟','How many rakahs is Dhuhr?',['أربع','Four'],['ركعتان','Two'],['ثلاث','Three']],
  ['كم ركعة صلاة العصر؟','How many rakahs is Asr?',['أربع','Four'],['ثلاث','Three'],['ركعتان','Two']],
  ['كم ركعة صلاة العشاء؟','How many rakahs is Isha?',['أربع','Four'],['ركعتان','Two'],['خمس','Five']],
  ['كم سجدة في كل ركعة؟','How many sujood in each rakah?',['سجدتان','Two'],['سجدة واحدة','One'],['ثلاث سجدات','Three']]]],
 [['بعد الصلاة','After the prayer'],'sparkle',[
  ['ماذا نقول ثلاث مرات بعد السلام من الصلاة؟','What do we say three times right after the salam?',['أستغفر الله','Astaghfirullah'],['صباح الخير','Good morning'],['وداعًا','Goodbye']],
  ['كم مرة نقول «سبحان الله» بعد الصلاة؟','How many times do we say "Subhanallah" after prayer?',['ثلاثًا وثلاثين','Thirty-three'],['عشر مرات','Ten'],['مرة واحدة','Once']],
  ['ما الآية العظيمة التي نقرؤها بعد كل صلاة؟','Which great verse do we read after every prayer?',['آية الكرسي','Ayat al-Kursi'],['آخر آية في القرآن','The last verse of the Quran'],['لا نقرأ شيئًا','We read nothing']],
  ['ما معنى الخشوع في الصلاة؟','What is khushu in prayer?',['أن نصلي بقلب حاضر وهدوء','Praying calmly with a present heart'],['أن نصلي بسرعة','Praying fast'],['أن نتكلم أثناء الصلاة','Talking during prayer']],
  ['هل نتكلم مع أصدقائنا ونحن نصلي؟','Do we talk to our friends while praying?',['لا','No'],['نعم','Yes'],['قليلًا فقط','Just a little']],
  ['ما أحب الأعمال إلى الله كما أخبر النبي ﷺ؟','Which deed is most beloved to Allah, as the Prophet ﷺ said?',['الصلاة على وقتها','Prayer on time'],['اللعب طوال اليوم','Playing all day'],['النوم الطويل','Sleeping a lot']]]]],
th:[
 [['الوضوء','Wudu'],'drop',[
  ['لماذا نتوضأ؟','Why do we make wudu?',['لنكون طاهرين للصلاة','To be pure for prayer'],['لنلعب بالماء','To play with water'],['لنبرد فقط','Just to cool down']],
  ['ماذا نقول قبل الوضوء؟','What do we say before wudu?',['بسم الله','Bismillah'],['آمين','Ameen'],['وداعًا','Goodbye']],
  ['بأي جهة نبدأ عند غسل اليدين والقدمين؟','Which side do we start with for hands and feet?',['اليمنى','The right'],['اليسرى','The left'],['لا يهم أبدًا','It never matters']],
  ['كم مرة يُسنّ غسل الأعضاء في الوضوء؟','How many times is it sunnah to wash each part?',['ثلاث مرات','Three times'],['عشر مرات','Ten times'],['خمس مرات','Five times']],
  ['ما أول ما نغسله في الوضوء؟','What do we wash first in wudu?',['الكفّين','The hands'],['القدمين','The feet'],['الأذنين','The ears']],
  ['كيف نستعمل الماء في الوضوء؟','How do we use water in wudu?',['بلا إسراف','Without wasting'],['نتركه يجري','Leave the tap running'],['نرشه على الأرض','Splash it on the floor']]]],
 [['أعضاء الوضوء','Parts of wudu'],'check',[
  ['ماذا نغسل بعد الوجه؟','What do we wash after the face?',['اليدين إلى المرفقين','Arms up to the elbows'],['القدمين','The feet'],['الظهر','The back']],
  ['ماذا نمسح في الوضوء؟','What do we wipe in wudu?',['الرأس','The head'],['البطن','The tummy'],['الركبتين','The knees']],
  ['إلى أين نغسل القدمين؟','Up to where do we wash the feet?',['إلى الكعبين','To the ankles'],['إلى الركبتين','To the knees'],['الأصابع فقط','Just the toes']],
  ['ما آخر ما نغسله في الوضوء؟','What do we wash last in wudu?',['القدمين','The feet'],['الوجه','The face'],['اليدين','The hands']],
  ['ما اسم إدخال الماء في الأنف وإخراجه في الوضوء؟','What is putting water in the nose in wudu called?',['الاستنشاق','Istinshaq'],['المضمضة','Rinsing the mouth'],['المسح','Wiping']],
  ['ماذا نقول بعد الوضوء؟','What do we say after wudu?',['أشهد أن لا إله إلا الله وأن محمدًا رسول الله','The testimony of faith'],['تصبح على خير','Good night'],['لا شيء','Nothing']]]],
 [['ما ينقض الوضوء','What breaks wudu'],'x',[
  ['هل الذهاب إلى الحمام لقضاء الحاجة ينقض الوضوء؟','Does using the toilet break wudu?',['نعم','Yes'],['لا','No'],['في الليل فقط','Only at night']],
  ['هل النوم العميق ينقض الوضوء؟','Does deep sleep break wudu?',['نعم','Yes'],['لا','No'],['يوم الجمعة فقط','Only on Friday']],
  ['هل شرب الماء ينقض الوضوء؟','Does drinking water break wudu?',['لا','No'],['نعم','Yes'],['إذا كان باردًا','If it is cold']],
  ['هل خروج الريح ينقض الوضوء؟','Does passing wind break wudu?',['نعم','Yes'],['لا','No'],['في البيت فقط','Only at home']],
  ['إذا انتقض وضوئي ماذا أفعل قبل الصلاة؟','If my wudu breaks, what do I do before praying?',['أتوضأ من جديد','Make wudu again'],['أصلي هكذا','Pray anyway'],['أترك الصلاة','Skip the prayer']],
  ['هل تصح الصلاة بلا وضوء؟','Is a prayer valid without wudu?',['لا','No'],['نعم','Yes'],['إذا كنت مستعجلًا','If I am in a hurry']]]],
 [['آداب الخلاء','Toilet manners'],'lock',[
  ['بأي رجل ندخل الخلاء (الحمام)؟','Which foot do we enter the toilet with?',['اليسرى','The left'],['اليمنى','The right'],['نقفز','We jump']],
  ['ماذا نقول قبل دخول الخلاء؟','What do we say before entering the toilet?',['اللهم إني أعوذ بك من الخبث والخبائث','O Allah, I seek refuge in You from evil'],['صباح الخير','Good morning'],['آمين','Ameen']],
  ['ماذا نقول عند الخروج من الخلاء؟','What do we say when leaving the toilet?',['غفرانك','Ghufranak (Your forgiveness)'],['شكرًا','Thank you'],['لا شيء','Nothing']],
  ['بأي يد ننظف أنفسنا في الخلاء؟','Which hand do we clean ourselves with?',['اليسرى','The left'],['اليمنى','The right'],['لا نستعمل يدًا','Neither']],
  ['هل ندخل المصحف إلى الحمام؟','Do we take the Mushaf into the toilet?',['لا','No'],['نعم','Yes'],['إذا كان صغيرًا','If it is small']],
  ['ماذا نفعل بعد قضاء الحاجة؟','What do we do after using the toilet?',['ننظف ونغسل أيدينا','Clean up and wash our hands'],['نخرج بلا غسل','Leave without washing'],['نمسح يدينا بالملابس','Wipe hands on clothes']]]],
 [['النظافة','Cleanliness'],'sparkle',[
  ['أكمل الحديث: «الطُّهور شطر …»','Complete the hadith: "Purity is half of…"',['الإيمان','Faith'],['الطعام','Food'],['اللعب','Play']],
  ['ما العود الذي نظّف به النبي ﷺ أسنانه؟','What stick did the Prophet ﷺ clean his teeth with?',['السواك','The miswak'],['القلم','A pen'],['الملعقة','A spoon']],
  ['متى يُستحب استعمال السواك؟','When is it sunnah to use the miswak?',['عند كل صلاة','At every prayer'],['مرة في السنة','Once a year'],['أبدًا','Never']],
  ['ماذا نفعل بأظافرنا إذا طالت؟','What do we do when our nails grow long?',['نقصّها','Cut them'],['نتركها تطول','Let them grow'],['نعضّها','Bite them']],
  ['ماذا نفعل قبل الأكل وبعده؟','What do we do before and after eating?',['نغسل أيدينا','Wash our hands'],['ننام','Sleep'],['نركض','Run']],
  ['كيف تكون ملابس المسلم؟','How should a Muslim\'s clothes be?',['نظيفة ومرتبة','Clean and tidy'],['متسخة','Dirty'],['ممزقة دائمًا','Always torn']]]],
 [['التيمم والغسل','Tayammum and ghusl'],'tree',[
  ['إذا لم نجد ماءً للوضوء ماذا نفعل؟','If there is no water for wudu, what do we do?',['نتيمم بالتراب الطاهر','Do tayammum with clean earth'],['نترك الصلاة','Skip the prayer'],['نؤجلها أسبوعًا','Delay it a week']],
  ['ماذا نمسح في التيمم؟','What do we wipe in tayammum?',['الوجه والكفين','The face and hands'],['القدمين','The feet'],['الظهر','The back']],
  ['ما اسم الطهارة بغسل الجسم كله؟','What is washing the whole body for purity called?',['الغُسل','Ghusl'],['التيمم','Tayammum'],['المسح','Wiping']],
  ['في أي يوم يُستحب الغسل كل أسبوع؟','On which day is ghusl recommended every week?',['يوم الجمعة','Friday'],['يوم الثلاثاء','Tuesday'],['يوم الأحد','Sunday']],
  ['بأي ماء نتوضأ؟','Which water do we make wudu with?',['الماء الطاهر النظيف','Clean, pure water'],['العصير','Juice'],['الماء المتسخ','Dirty water']],
  ['هل التيمم يكون بالتراب أم بالعطر؟','Is tayammum done with earth or perfume?',['بالتراب','With earth'],['بالعطر','With perfume'],['بالصابون','With soap']]]]],
ak:[
 [['الصدق','Honesty'],'check',[
  ['ماذا يقول المسلم دائمًا؟','What does a Muslim always say?',['الصدق','The truth'],['الكذب','Lies'],['ما يريحه فقط','Whatever is easy']],
  ['إلى أين يهدي الصدق؟','Where does truthfulness lead?',['إلى البر والجنة','To goodness and Paradise'],['إلى المشاكل','To trouble'],['إلى لا شيء','Nowhere']],
  ['بماذا كان يُلقَّب النبي ﷺ قبل البعثة؟','What was the Prophet ﷺ called before prophethood?',['الصادق الأمين','The truthful, the trustworthy'],['الفارس','The knight'],['التاجر الغني','The rich trader']],
  ['إذا كسرت شيئًا بالخطأ ماذا أفعل؟','If I break something by mistake, what do I do?',['أقول الحقيقة وأعتذر','Tell the truth and say sorry'],['أكذب','Lie'],['ألوم أخي','Blame my brother']],
  ['هل يجوز الكذب لنُضحك الناس؟','Is it okay to lie to make people laugh?',['لا','No'],['نعم','Yes'],['إذا كانت النكتة جميلة','If the joke is good']],
  ['إذا وعدت صديقي بشيء ماذا أفعل؟','If I promise my friend something, what do I do?',['أفي بوعدي','Keep my promise'],['أنساه','Forget it'],['أخلفه','Break it']]]],
 [['بر الوالدين','Kindness to parents'],'heart',[
  ['كيف نكلم والدينا؟','How do we speak to our parents?',['بأدب ولطف','Politely and gently'],['بصوت مرتفع','Loudly'],['لا نكلمهم','We do not talk to them']],
  ['هل نقول لوالدينا «أُفّ»؟','Do we say "uff" to our parents?',['لا','No'],['نعم','Yes'],['إذا تعبنا','When we are tired']],
  ['ما الدعاء الذي علّمنا الله أن ندعو به لوالدينا؟','Which dua did Allah teach us for our parents?',['ربِّ ارحمهما كما ربياني صغيرًا','My Lord, have mercy on them as they raised me'],['لا ندعو لهم','We do not pray for them'],['تصبحون على خير','Good night']],
  ['من أحق الناس بحسن صحبتي كما قال النبي ﷺ؟','Who deserves my best company most, as the Prophet ﷺ said?',['أمي','My mother'],['صديقي','My friend'],['جاري','My neighbour']],
  ['إذا نادتني أمي وأنا ألعب؟','If my mother calls me while I am playing?',['أجيبها فورًا','Answer her straight away'],['أتجاهلها','Ignore her'],['أكمل اللعب','Keep playing']],
  ['كيف أساعد والديّ؟','How do I help my parents?',['أساعدهم في أعمال البيت','Help with housework'],['أترك البيت فوضى','Make a mess'],['لا أساعد','Never help']]]],
 [['الرحمة والرفق','Mercy and gentleness'],'drop',[
  ['كيف نعامل الحيوانات؟','How do we treat animals?',['برحمة ونطعمها','With mercy, and feed them'],['نؤذيها','Hurt them'],['نرميها بالحجارة','Throw stones at them']],
  ['كيف نعامل من هو أصغر منا؟','How do we treat those younger than us?',['نرحمه ونلطف به','With mercy and kindness'],['نخيفه','Scare them'],['نأخذ ألعابه','Take their toys']],
  ['كيف نعامل كبار السن؟','How do we treat elderly people?',['نحترمهم ونوقرهم','Respect and honour them'],['نسخر منهم','Make fun of them'],['نتجاهلهم','Ignore them']],
  ['إذا رأيت زميلي حزينًا؟','If I see my classmate sad?',['أواسيه وأساعده','Comfort and help them'],['أضحك عليه','Laugh at them'],['أتركه وحده','Leave them alone']],
  ['أكمل الحديث: «إن الرفق لا يكون في شيء إلا …»','Complete: "Gentleness is not in anything except that it…"',['زانه','Beautifies it'],['أفسده','Spoils it'],['أخّره','Delays it']],
  ['من الذي لا يرحمه الله كما قال النبي ﷺ؟','Whom does Allah not show mercy to, as the Prophet ﷺ said?',['من لا يرحم الناس','Whoever is not merciful to people'],['من ينام مبكرًا','Whoever sleeps early'],['من يحب الحلوى','Whoever likes sweets']]]],
 [['السلام والكلام','Greetings and speech'],'bell',[
  ['ماذا نقول عندما نلقى مسلمًا؟','What do we say when we meet a Muslim?',['السلام عليكم','Assalamu alaikum'],['لا شيء','Nothing'],['ابتعد','Go away']],
  ['كيف نرد السلام؟','How do we answer the salam?',['وعليكم السلام ورحمة الله','Wa alaikum assalam wa rahmatullah'],['شكرًا','Thank you'],['نسكت','Stay silent']],
  ['ماذا نقول لمن عطس وقال «الحمد لله»؟','What do we say to someone who sneezed and said Alhamdulillah?',['يرحمك الله','Yarhamukallah'],['صحة','Bless you only'],['لا شيء','Nothing']],
  ['ماذا نقول لمن أعطانا شيئًا أو ساعدنا؟','What do we say to someone who helped us?',['جزاك الله خيرًا','Jazakallahu khayran'],['لا شيء','Nothing'],['أعطني المزيد','Give me more']],
  ['أكمل: «الكلمة الطيبة …»','Complete: "A good word is…"',['صدقة','A charity'],['ضعف','Weakness'],['لا فائدة منها','Useless']],
  ['هل نقاطع من يتكلم؟','Do we interrupt someone who is talking?',['لا، ننتظر حتى ينتهي','No, we wait until they finish'],['نعم','Yes'],['نرفع صوتنا عليه','We talk over them']]]],
 [['الأمانة والتعاون','Trust and teamwork'],'users',[
  ['إذا وجدت شيئًا ليس لي؟','If I find something that is not mine?',['أعطيه لصاحبه أو لكبير','Give it to its owner or an adult'],['آخذه','Keep it'],['أرميه','Throw it away']],
  ['إذا استعرت قلم صديقي؟','If I borrow my friend\'s pen?',['أرجعه سليمًا','Give it back unbroken'],['أخفيه','Hide it'],['أكسره','Break it']],
  ['على ماذا أمرنا الله أن نتعاون؟','What did Allah tell us to cooperate in?',['على البر والتقوى','Goodness and piety'],['على الأذى','Harm'],['على الكسل','Laziness']],
  ['إذا رأيت أحدًا يحتاج مساعدة؟','If I see someone who needs help?',['أساعده','Help them'],['أتجاهله','Ignore them'],['أضحك عليه','Laugh at them']],
  ['هل آخذ أغراض إخوتي دون إذن؟','Do I take my siblings\' things without asking?',['لا، أستأذن أولًا','No, I ask first'],['نعم','Yes'],['إذا كانوا نائمين','If they are asleep']],
  ['من هو المسلم كما قال النبي ﷺ؟','Who is a Muslim, as the Prophet ﷺ said?',['من سلم الناس من لسانه ويده','Whose tongue and hand do not harm people'],['من يملك مالًا كثيرًا','Whoever has much money'],['من يغلب في كل لعبة','Whoever wins every game']]]],
 [['الصبر والشكر','Patience and thanks'],'sun',[
  ['ماذا نقول إذا أصابنا شيء يحزننا؟','What do we say when something sad happens?',['إنا لله وإنا إليه راجعون','To Allah we belong and to Him we return'],['هذا ظلم','This is unfair'],['لا شيء','Nothing']],
  ['ماذا نقول عندما تأتينا نعمة؟','What do we say when we get a blessing?',['الحمد لله','Alhamdulillah'],['أنا الأفضل','I am the best'],['لا شيء','Nothing']],
  ['ماذا نفعل إذا غضبنا؟','What do we do when we are angry?',['نسكت ونستعيذ بالله من الشيطان','Stay quiet and seek refuge in Allah'],['نضرب','Hit'],['نصرخ','Shout']],
  ['ما معنى التواضع؟','What is humility?',['ألا أتكبر على الناس','Not acting above others'],['أن أتفاخر','Showing off'],['أن أسخر من الآخرين','Mocking others']],
  ['إذا فاز صديقي في مسابقة؟','If my friend wins a competition?',['أفرح له وأهنئه','Be happy and congratulate them'],['أحسده','Envy them'],['أغضب','Get angry']],
  ['من الذين يحبهم الله؟','Whom does Allah love?',['الصابرون','The patient'],['المتكبرون','The arrogant'],['الكاذبون','The liars']]]]],
qr:[
 [['القرآن الكريم','The noble Quran'],'book',[
  ['ما الكتاب الذي أنزله الله على محمد ﷺ؟','Which book did Allah reveal to Muhammad ﷺ?',['القرآن الكريم','The Quran'],['التوراة','The Torah'],['الزبور','The Psalms']],
  ['من الملَك الذي نزل بالقرآن على النبي ﷺ؟','Which angel brought the Quran to the Prophet ﷺ?',['جبريل عليه السلام','Jibreel'],['ميكائيل','Mikaeel'],['مالك','Malik']],
  ['في أي شهر نزل القرآن؟','In which month was the Quran revealed?',['رمضان','Ramadan'],['رجب','Rajab'],['محرم','Muharram']],
  ['في أي ليلة نزل القرآن؟','On which night was the Quran revealed?',['ليلة القدر','Laylat al-Qadr'],['ليلة العيد','The night of Eid'],['ليلة الجمعة','Friday night']],
  ['في أي غار نزل أول القرآن؟','In which cave did the first revelation come?',['غار حراء','The cave of Hira'],['غار ثور','The cave of Thawr'],['كهف في الشام','A cave in Syria']],
  ['ما أول كلمة نزلت من القرآن؟','What was the first word revealed?',['اقرأ','Iqra (Read)'],['قل','Qul (Say)'],['الحمد','Al-hamd (Praise)']]]],
 [['سور القرآن','Surahs of the Quran'],'list',[
  ['كم عدد سور القرآن الكريم؟','How many surahs are in the Quran?',['مئة وأربع عشرة','114'],['مئة','100'],['ثلاثون','30']],
  ['ما أول سورة في المصحف؟','What is the first surah in the Mushaf?',['الفاتحة','Al-Fatihah'],['البقرة','Al-Baqarah'],['الناس','An-Nas']],
  ['ما آخر سورة في المصحف؟','What is the last surah in the Mushaf?',['الناس','An-Nas'],['الفلق','Al-Falaq'],['الفاتحة','Al-Fatihah']],
  ['ما أطول سورة في القرآن؟','What is the longest surah?',['البقرة','Al-Baqarah'],['الكوثر','Al-Kawthar'],['الإخلاص','Al-Ikhlas']],
  ['ما أقصر سورة في القرآن؟','What is the shortest surah?',['الكوثر','Al-Kawthar'],['البقرة','Al-Baqarah'],['يس','Ya-Sin']],
  ['كم جزءًا في القرآن الكريم؟','How many juz are in the Quran?',['ثلاثون','Thirty'],['ستون','Sixty'],['عشرة','Ten']]]],
 [['أسماء السور','Names of surahs'],'tag',[
  ['سورة باسم حشرة تصنع العسل، ما هي؟','A surah named after an insect that makes honey?',['النحل','An-Nahl (The Bee)'],['النمل','An-Naml (The Ant)'],['العنكبوت','Al-Ankabut (The Spider)']],
  ['سورة باسم حشرة صغيرة حذّرت قومها من جيش سليمان؟','A surah named after a small insect that warned its people of Sulayman\'s army?',['النمل','An-Naml (The Ant)'],['النحل','An-Nahl (The Bee)'],['الفيل','Al-Fil (The Elephant)']],
  ['سورة فيها قصة الفتية الذين ناموا في الكهف؟','Which surah tells of the youths who slept in the cave?',['الكهف','Al-Kahf'],['يوسف','Yusuf'],['مريم','Maryam']],
  ['سورة باسم أم عيسى عليه السلام؟','Which surah is named after the mother of Isa?',['مريم','Maryam'],['النساء','An-Nisa'],['الحجرات','Al-Hujurat']],
  ['أي سورة تعدل ثلث القرآن؟','Which surah equals a third of the Quran?',['الإخلاص','Al-Ikhlas'],['الكوثر','Al-Kawthar'],['العصر','Al-Asr']],
  ['سورة باسم نبي التقمه الحوت؟','A surah named after the prophet swallowed by the whale?',['يونس','Yunus'],['هود','Hud'],['إبراهيم','Ibrahim']]]],
 [['آداب التلاوة','Reading manners'],'heart',[
  ['ماذا نقول قبل أن نقرأ القرآن؟','What do we say before reading the Quran?',['أعوذ بالله من الشيطان الرجيم','I seek refuge in Allah from Shaytan'],['صباح الخير','Good morning'],['لا شيء','Nothing']],
  ['كيف نقرأ القرآن؟','How do we read the Quran?',['بتمهّل وترتيل','Slowly and beautifully'],['بسرعة كبيرة','Very fast'],['ونحن نلعب','While playing']],
  ['أين نضع المصحف؟','Where do we put the Mushaf?',['في مكان نظيف مرتفع','In a clean, high place'],['على الأرض','On the floor'],['تحت الوسادة','Under the pillow']],
  ['كم حسنة لنا في كل حرف نقرؤه من القرآن؟','How many good deeds for each letter of the Quran we read?',['عشر حسنات','Ten'],['حسنة واحدة','One'],['لا شيء','None']],
  ['ماذا نفعل عندما يُقرأ القرآن؟','What do we do when the Quran is being recited?',['نستمع وننصت','Listen quietly'],['نتكلم','Talk'],['نشغّل الأغاني','Play songs']],
  ['أكمل الحديث: «خيركم من تعلّم القرآن و…»','Complete: "The best of you are those who learn the Quran and…"',['علّمه','Teach it'],['نسيه','Forget it'],['تركه','Leave it']]]],
 [['قصص الأنبياء في القرآن','Prophets in the Quran'],'tree',[
  ['أي نبي بنى السفينة العظيمة؟','Which prophet built the great ark?',['نوح عليه السلام','Nuh'],['موسى عليه السلام','Musa'],['يوسف عليه السلام','Yusuf']],
  ['أي نبي أُلقي في النار فكانت بردًا وسلامًا؟','Which prophet was thrown into the fire that became cool and safe?',['إبراهيم عليه السلام','Ibrahim'],['نوح عليه السلام','Nuh'],['عيسى عليه السلام','Isa']],
  ['أي نبي شقّ الله له البحر بعصاه؟','For which prophet did Allah split the sea with his staff?',['موسى عليه السلام','Musa'],['سليمان عليه السلام','Sulayman'],['هود عليه السلام','Hud']],
  ['أي نبي فهّمه الله كلام الطير والنمل؟','Which prophet understood the speech of birds and ants?',['سليمان عليه السلام','Sulayman'],['يونس عليه السلام','Yunus'],['نوح عليه السلام','Nuh']],
  ['أي نبي التقمه الحوت؟','Which prophet was swallowed by the whale?',['يونس عليه السلام','Yunus'],['إبراهيم عليه السلام','Ibrahim'],['يوسف عليه السلام','Yusuf']],
  ['أي نبي ألقاه إخوته في البئر؟','Which prophet was thrown into a well by his brothers?',['يوسف عليه السلام','Yusuf'],['موسى عليه السلام','Musa'],['صالح عليه السلام','Salih']]]],
 [['قصار السور','Short surahs'],'star',[
  ['أكمل: «قل هو الله …»','Complete: "Qul huwa Allahu…"',['أحد','Ahad'],['أكبر','Akbar'],['رحيم','Raheem']],
  ['أكمل: «إنا أعطيناك …»','Complete: "Inna aatainaka…"',['الكوثر','Al-Kawthar'],['الجنة','Al-Jannah'],['النجوم','An-Nujum']],
  ['أكمل: «إذا جاء نصر الله و…»','Complete: "Idha jaa nasrullahi wa…"',['الفتح','Al-Fath'],['النور','An-Nur'],['المطر','The rain']],
  ['كم آية في سورة الفاتحة؟','How many verses are in Al-Fatihah?',['سبع آيات','Seven'],['خمس آيات','Five'],['عشر آيات','Ten']],
  ['أكمل: «الحمد لله …»','Complete: "Alhamdu lillahi…"',['رب العالمين','Rabbil-alameen'],['الكريم','Al-Kareem'],['وحده','Wahdah']],
  ['عن ماذا تتحدث سورة الإخلاص؟','What is Surat al-Ikhlas about?',['توحيد الله','The oneness of Allah'],['قصة نوح','The story of Nuh'],['الصيام','Fasting']]]]]
};
const SECC={fq:['#7CC6FF','#2F6BFF'],sl:['#B49BFF','#7A4DFF'],th:['#6EE7F9','#0EA5C6'],ak:['#FF9AC2','#F0457A'],qr:['#7BE495','#21B26B']};
for(const [s,js] of Object.entries(QX))js.forEach(([t,ic,rows],i)=>QZ.push({id:`${s}${i+1}`,s,t:{ar:t[0],en:t[1]},ic,c:SECC[s],
  q:rows.map(([qa,qe,...as])=>({q:{ar:qa,en:qe},a:as.map(([ar,en])=>({ar,en}))}))}));
/* ---------- play world: theme islands joined by bridges, and a mood buddy for the quiz ---------- */
const WB={
 web:{body:`<g stroke="#1E2140" stroke-width="3" stroke-linecap="round" fill="none"><path d="M22 30q-10-6-14-1M22 35q-11-1-15 6M23 39q-8 4-10 12M25 26q-6-9-12-9"/><path d="M42 30q10-6 14-1M42 35q11-1 15 6M41 39q8 4 10 12M39 26q6-9 12-9"/></g><ellipse cx="32" cy="34" rx="13" ry="14" fill="#2F3366"/><ellipse cx="28" cy="29" rx="6" ry="5" fill="#7C86FF" opacity=".35"/>`,
  eyes:[[26.5,31],[37.5,31]],sclera:5,pupil:'#1B1B2F',mouth:[32,40,4.5],mc:'#fff',cheek:[[22.5,38],[41.5,38]]},
 royal:{body:`<path d="M32 4l8 16.5 18 2.6-13 12.7 3.1 17.9L32 45.3l-16.1 8.4L19 35.8 6 23.1l18-2.6z" fill="#FFC93C" stroke="#E59A00" stroke-width="2.5" stroke-linejoin="round"/>`,
  eyes:[[26,29],[38,29]],sclera:0,pupil:'#2B1B12',mouth:[32,36,5],mc:'#8E3F2A',cheek:[[22,35],[42,35]]},
 sea:{body:`<path d="M12 32L2 22v20z" fill="#FF7A2F"/><ellipse cx="34" cy="32" rx="22" ry="16" fill="#FF8A3D"/><path d="M30 17c4-6 10-6 13-2-5 0-9 1-13 2z" fill="#FF6A1F"/><path d="M22 26v12M27 22v20" stroke="#fff" stroke-width="3.5" opacity=".8"/>`,
  eyes:[[45,28]],sclera:6.5,pupil:'#16324A',mouth:[49,38,4],mc:'#8E3F1A',cheek:[[40,36]]},
 speed:{body:`<circle cx="34" cy="30" r="17" fill="#2F6BFF"/><ellipse cx="34" cy="35" rx="10" ry="7.5" fill="#FFE2C4"/><path d="M27 46l-3 8h9zM39 46l-1 8h9z" fill="#E8352B"/>`,
  eyes:[[29,27],[39,27]],sclera:4.5,pupil:'#16324A',mouth:[34,37,4],mc:'#8E3F2A',cheek:[]},
 blocks:{body:`<rect x="18" y="4" width="4" height="8" fill="#7A7A7A"/><rect x="16" y="2" width="8" height="5" fill="#E8352B"/><rect x="12" y="12" width="40" height="32" fill="#5DBB3F"/><rect x="12" y="12" width="40" height="6" fill="#7CD65A"/><rect x="12" y="40" width="40" height="4" fill="#3E8A2A"/><rect x="20" y="44" width="8" height="12" fill="#7A4E2D"/><rect x="36" y="44" width="8" height="12" fill="#7A4E2D"/>`,
  eyes:[[24,26],[40,26]],sclera:4.5,pupil:'#16324A',mouth:[32,35,5],mc:'#2E5E1E',cheek:[]}
};
function wFace(b,mood){
  let s='';const [mx,my,w]=b.mouth;
  b.eyes.forEach(([x,y],i)=>{
    if(mood==='happy'){s+=`<path d="M${x-3.4} ${y+1}q3.4-4.6 6.8 0" stroke="${b.sclera?b.pupil:b.pupil}" stroke-width="2.6" fill="none" stroke-linecap="round"${b.sclera?` transform="translate(0 0)"`:''}/>`;
      if(b.sclera)s=`<ellipse cx="${x}" cy="${y}" rx="${b.sclera}" ry="${b.sclera*1.1}" fill="#fff"/>`+s;}
    else{if(b.sclera)s+=`<ellipse cx="${x}" cy="${y}" rx="${b.sclera}" ry="${b.sclera*1.1}" fill="#fff"/>`;
      s+=`<circle cx="${x}" cy="${y+(mood==='sad'?1.6:0)}" r="${b.sclera?2.6:3.2}" fill="${b.pupil}"/><circle cx="${x+.9}" cy="${y-.4+(mood==='sad'?1.6:0)}" r=".9" fill="#fff"/>`;
      if(mood==='sad'){const d=i===0&&b.eyes.length>1?1:-1;s+=`<path d="M${x-4} ${y-6-d*1.5}L${x+4} ${y-6+d*1.5}" stroke="${b.mc==='#fff'?'#fff':b.pupil}" stroke-width="2.2" stroke-linecap="round"/>`}}
  });
  b.cheek.forEach(([x,y])=>s+=`<circle cx="${x}" cy="${y}" r="2.4" fill="#FF6B8E" opacity="${mood==='sad'?.35:.75}"/>`);
  if(mood==='happy')s+=`<path d="M${mx-w} ${my-1}Q${mx} ${my+w*1.5} ${mx+w} ${my-1}Z" fill="#7A1F33"/><path d="M${mx-w*.45} ${my+w*.55}Q${mx} ${my+w*.2} ${mx+w*.45} ${my+w*.55}Q${mx} ${my+w*.95} ${mx-w*.45} ${my+w*.55}" fill="#FF7B92"/>`;
  else if(mood==='sad'){s+=`<path d="M${mx-w} ${my+3}Q${mx} ${my-3.6} ${mx+w} ${my+3}" stroke="${b.mc}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    const [tx,ty]=b.eyes[b.eyes.length-1];s+=`<path class="tear" d="M${tx+2} ${ty+4}q-3 5 0 7q3-2 0-7z" fill="#6EC8FF" stroke="#fff" stroke-width=".6"/>`}
  else s+=`<path d="M${mx-w*.7} ${my}q${w*.7} ${w*.6} ${w*1.4} 0" stroke="${b.mc}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  return s;
}
const WSTAR='M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z';
function wBuddy(mood){const b=WB[pal]||WB.royal;
  const sp=mood==='happy'?[['-6%','-10%'],['8%','auto','-12%'],['auto','-14%','auto','2%']].map((p,i)=>`<svg class="spark s${i}" viewBox="0 0 24 24" style="top:${p[0]};inset-inline-start:${p[1]};${p[2]?`inset-inline-end:${p[2]};`:''}${p[3]?`bottom:${p[3]};`:''}"><path d="${WSTAR}"/></svg>`).join(''):'';
  return `<svg viewBox="0 0 64 64">${b.body}${wFace(b,mood)}</svg>${sp}`}
function setMood(mood){const el=document.querySelector('.wBd');if(!el)return;el.className='wBd '+mood;el.innerHTML=wBuddy(mood);
  clearTimeout(setMood.t)}

/* each theme gets its own sea, island greens and one landmark */
/* game-board quiz colours per theme: ribbon pair and one candy colour (light, main, edge) per answer */
const QB={
 royal:{r:['#FF5FA2','#D62F7A'],g:[['#B48CFF','#7C4DFF','#5A2FD6'],['#FF8CC0','#F0569F','#B5306F'],['#4FE0D8','#18A9B5','#0E7A84']]},
 web:{r:['#FF4D6D','#C9183D'],g:[['#FF7A93','#FF2E58','#B5133A'],['#6F9BFF','#3561F0','#1F3FB0'],['#FFD66B','#F2A20C','#B97700']]},
 sea:{r:['#FF8A3D','#E0601A'],g:[['#FFB06B','#FF7A2F','#C2531A'],['#5FF0C8','#18B58C','#0E7F61'],['#8FA6FF','#5B6CFF','#3A47C2']]},
 speed:{r:['#FF5A4E','#C21D14'],g:[['#FF7B6E','#E8352B','#A81E16'],['#FFD25E','#FFB400','#C28400'],['#5EE39A','#1FB45A','#13803F']]},
 blocks:{r:['#FF8A3D','#D9611A'],g:[['#FFCC66','#FFA41B','#C27500'],['#8BE068','#4EA83A','#2E7520'],['#7CC6FF','#3A92E8','#2364AE']]}
};
const QSCENE='<svg class="qScene" viewBox="0 0 300 300" preserveAspectRatio="none" aria-hidden="true"><path d="M0 120Q60 70 120 110T240 90 300 100V300H0Z" fill="rgba(255,255,255,.22)"/><path d="M0 170Q80 130 150 160T300 150V300H0Z" fill="rgba(255,255,255,.16)"/></svg><div class="qClouds" aria-hidden="true"><i></i><i></i><i></i></div>';
const WW={
 blocks:{w:['#46B4F5','#1C78C8'],g:['#8EE068','#4E9E36'],acc:'#FFB52E',sky:['#8ED8FF','#4FB0F0']},
 sea:{w:['#22C1E0','#0A5D8F'],g:['#9BE070','#4FA23A'],acc:'#FF8A3D',sky:['#5FD3F3','#1E88C7']},
 web:{w:['#2E2A72','#0F0C2E'],g:['#4F9E78','#25553F'],acc:'#FF4D6D',sky:['#1B1E4B','#3B2C7A']},
 royal:{w:['#B9A2FF','#7E5BE6'],g:['#FFC9E4','#E58BBE'],acc:'#FFC93C',sky:['#F8B5D3','#C59BFF']},
 speed:{w:['#3A86FF','#1846B0'],g:['#4FD06A','#2A8F42'],acc:'#E8352B',sky:['#9AD0FF','#2F6BFF']}
};
const MARK={
 blocks:'<rect x="-3" y="0" width="6" height="12" fill="#7A4E2D"/><rect x="-12" y="-20" width="24" height="22" fill="#3E9E2A"/><rect x="-12" y="-20" width="24" height="7" fill="#62C845"/><rect x="-6" y="-12" width="6" height="6" fill="#2E7E1E"/>',
 sea:'<path d="M-6 12L-4-18h8L6 12z" fill="#fff"/><path d="M-5.4 2h10.8M-4.6-8h9.2" stroke="#E8352B" stroke-width="5"/><rect x="-6" y="-24" width="12" height="7" rx="2" fill="#FFE27A"/><path d="M-8-24L0-31 8-24z" fill="#E8352B"/>',
 web:'<rect x="-11" y="-26" width="22" height="38" rx="2" fill="#2A2C66"/><g fill="#FFD66B"><rect x="-7" y="-21" width="4" height="4"/><rect x="3" y="-21" width="4" height="4"/><rect x="-7" y="-13" width="4" height="4" opacity=".4"/><rect x="3" y="-13" width="4" height="4"/><rect x="-7" y="-5" width="4" height="4"/><rect x="3" y="-5" width="4" height="4" opacity=".4"/></g><path d="M-11-26L11 12M11-26L-11 12" stroke="#fff" stroke-width=".6" opacity=".5"/>',
 royal:'<rect x="-9" y="-10" width="18" height="22" fill="#FFB3D6"/><path d="M-12-10L0-28 12-10z" fill="#9B6BFF"/><path d="M0-28v-8l8 3-8 3" stroke="#9B6BFF" stroke-width="1.6" fill="#FFC93C"/><rect x="-3" y="2" width="6" height="10" rx="3" fill="#C2185B" opacity=".6"/>',
 speed:'<path d="M-2 12V-24" stroke="#555" stroke-width="2.4"/><path d="M-1-24h18v12H-1z" fill="#fff"/><path d="M-1-24h6v6h-6zM11-24h6v6h-6zM5-18h6v6H5z" fill="#222"/><path d="M8 12l5-14 5 14z" fill="#FF7A1A"/>'
};
const seedR=s=>{const x=Math.sin(s*999)*10000;return x-Math.floor(x)};
function blob(cx,cy,rx,ry,seed,sc=1,dy=0){const n=12,p=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2,j=.86+seedR(seed+i)*.24;p.push([cx+Math.cos(a)*rx*sc*j,cy+dy+Math.sin(a)*ry*sc*j])}
  let d=`M${((p[0][0]+p[1][0])/2).toFixed(1)} ${((p[0][1]+p[1][1])/2).toFixed(1)}`;for(let i=1;i<=n;i++){const a=p[i%n],b=p[(i+1)%n];d+=`Q${a[0].toFixed(1)} ${a[1].toFixed(1)} ${((a[0]+b[0])/2).toFixed(1)} ${((a[1]+b[1])/2).toFixed(1)}`}return d+'Z'}
function palm(x,y,s,f=1){return `<g transform="translate(${x} ${y}) scale(${s*f} ${s})"><ellipse cx="6" cy="2" rx="12" ry="3.5" fill="rgba(0,0,0,.18)"/><path d="M0 2C2-10 1-22 6-32" stroke="#8A5A2B" stroke-width="4.2" fill="none" stroke-linecap="round"/><path d="M0 2C2-10 1-22 6-32" stroke="#B07A45" stroke-width="1.6" fill="none" stroke-dasharray="2 3"/>
  <g fill="#2FA84F"><path d="M6-32q-14-6-22 4q10-6 22-4z"/><path d="M6-32q14-8 22 2q-10-5-22-2z"/><path d="M6-32q-6-12-18-12q10 3 18 12z"/><path d="M6-32q6-12 18-10q-10 2-18 10z"/></g><circle cx="5" cy="-30" r="2.4" fill="#7A4E2D"/></g>`}
function island(x,y,i,st,w){const s=i*7+3,gid='wg'+i;
  return `<g class="isl ${st}"><defs><radialGradient id="${gid}" cx=".4" cy=".35"><stop offset="0" stop-color="${w.g[0]}"/><stop offset="1" stop-color="${w.g[1]}"/></radialGradient></defs>
   <path d="${blob(x,y,98,60,s,1.42)}" fill="url(#wReef)"/>
   <path class="foam" d="${blob(x,y,98,60,s,1.13)}" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="3" stroke-dasharray="12 9"/>
   <path d="${blob(x,y,98,60,s,1.07,4)}" fill="#C9A564"/><path d="${blob(x,y,98,60,s,1)}" fill="url(#wSand)"/>
   <path d="${blob(x,y,98,60,s+5,.7,-6)}" fill="url(#${gid})"/><ellipse cx="${x-12}" cy="${y-16}" rx="26" ry="9" fill="#fff" opacity=".14"/>
   <ellipse cx="${x+74}" cy="${y+18}" rx="7" ry="5" fill="#9AA6B2"/><ellipse cx="${x+72}" cy="${y+16}" rx="3" ry="2" fill="#C7D0D8"/><ellipse cx="${x-80}" cy="${y+10}" rx="5" ry="3.6" fill="#9AA6B2"/>
   ${palm(x+(i%2?-58:50),y-2,1.2,i%2?-1:1)}${palm(x+(i%2?-40:66),y+16,.95,i%2?1:-1)}
   <g transform="translate(${x+(i%2?48:-50)} ${y-8}) scale(1.45)">${MARK[pal]||MARK.royal}</g>
   ${st==='locked'?`<path d="${blob(x,y,98,60,s,1.15)}" fill="url(#wFog)"/>`:''}</g>`}
function bridge(a,b,done,w){const [x1,y1]=a,[x2,y2]=b,mx=(x1+x2)/2,my=(y1+y2)/2+14,d=`M${x1} ${y1}Q${mx} ${my} ${x2} ${y2}`;
  return `<path d="${d}" stroke="rgba(0,0,0,.18)" stroke-width="20" fill="none" transform="translate(4 10)"/><path d="${d}" stroke="#5E3B1E" stroke-width="18" fill="none"/>
   <path d="${d}" stroke="${done?'#E9BC7C':'#B78A57'}" stroke-width="13" fill="none" stroke-dasharray="5 2.5"/>
   <path d="${d}" stroke="${done?w.acc:'#7A5531'}" stroke-width="2.6" fill="none" transform="translate(0 -9)"/><path d="${d}" stroke="${done?w.acc:'#7A5531'}" stroke-width="2.6" fill="none" transform="translate(0 9)"/>`}
const SHIP=c=>`<svg viewBox="0 0 80 60"><path d="M8 40h64l-9 14H17z" fill="#8A4B22"/><path d="M8 40h64l-2 4H10z" fill="#B0652F"/><path d="M38 6v34" stroke="#5E3B1E" stroke-width="3"/><path d="M40 8q22 14 0 30z" fill="#fff"/><path d="M36 12q-18 12 0 26z" fill="#F4F1E8"/><path d="M38 6h12l-4 4 4 4H38z" fill="${c}"/><path d="M4 56q8-4 16 0t16 0 16 0 16 0 8 0" stroke="rgba(255,255,255,.7)" stroke-width="2.5" fill="none"/></svg>`;

let qSec='aq';try{qSec=localStorage.getItem('najmati-sec')||'aq'}catch(e){}
function playView(k){
  if(!SECS[qSec])qSec='aq';
  const JS=secJ(qSec),w=WW[pal]||WW.royal,n=JS.length,gap=185,W0=360,H=n*gap+260,P=JS.map((_,j)=>[j%2?238:122,H-120-j*gap]),T=[180,115];
  const done=JS.filter(J=>qLog(k.id,J.id)).length,cur=JS.findIndex(J=>!qLog(k.id,J.id));
  const st=J=>qLog(k.id,J.id)?'done':qOpen(k.id,J.id)?'open':'locked';
  const pos=([x,y])=>`left:${x/W0*100}%;top:${y/H*100}%`;
  const all=[...P,T];
  const tabs=Object.entries(SECS).map(([key,S0])=>{const l=secJ(key),d=l.filter(J=>qLog(k.id,J.id)).length;
    return `<button class="secB" data-qsec="${key}" aria-pressed="${key===qSec}" style="--c1:${S0.c[0]};--c2:${S0.c[1]}"><span class="secIc">${I(S0.ic)}</span><b>${esc(tr(S0.t))}</b><small><bdi dir="ltr">${d}/${l.length}</bdi></small></button>`}).join('');
  return `<div class="secRow" role="group" aria-label="${L('secPick')}">${tabs}</div><section class="wSea" style="--w1:${w.w[0]};--w2:${w.w[1]};--acc:${w.acc}">
   <div class="wHead"><span class="chip" style="background:linear-gradient(135deg,${SECS[qSec].c[0]},${SECS[qSec].c[1]})">${I(SECS[qSec].ic)}</span><div><h3>${L('advOf',tr(SECS[qSec].t))}</h3><small>${L('advP')} · ${L('jDone',done,n)}</small></div></div>
   <div class="wWaves"></div>${[[18,52,0],[46,70,-25],[78,60,-48]].map(([t,dur,del],i)=>`<span class="wShip s${i}" style="top:${t}%;animation-duration:${dur}s;animation-delay:${del}s">${SHIP(i===1?w.acc:'#E8352B')}</span>`).join('')}
   <div class="wMap" style="aspect-ratio:${W0}/${H}"><svg viewBox="0 0 ${W0} ${H}" aria-hidden="true"><defs>
     <radialGradient id="wReef"><stop offset=".55" stop-color="#7FF0E6" stop-opacity=".75"/><stop offset="1" stop-color="#7FF0E6" stop-opacity="0"/></radialGradient>
     <linearGradient id="wSand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBE9B4"/><stop offset="1" stop-color="#E8C887"/></linearGradient>
     <radialGradient id="wFog"><stop offset="0" stop-color="#E9F1F7" stop-opacity=".55"/><stop offset="1" stop-color="#E9F1F7" stop-opacity=".2"/></radialGradient></defs>
     ${all.slice(0,-1).map((p,j)=>bridge(p,all[j+1],j<done&&j+1<=done,w)).join('')}
     ${P.map((p,j)=>island(p[0],p[1],j,st(JS[j]),w)).join('')}${island(T[0],T[1],n,done===n?'done':'locked',w)}</svg>
   ${P.map((p,j)=>{const J=JS[j],s=st(J),lg=qLog(k.id,J.id),m=lg?.miss,best=Math.max(1,qBest(k.id,J.id),m==null?0:m===0?3:m<=2?2:1),here=j===cur;
     return `<div class="wStop ${s} ${here?'here':''}" style="${pos(p)}">
       ${s==='done'?`<div class="wStars">${[1,2,3].map(x=>`<svg viewBox="0 0 24 24" class="${x<=best?'on':''}"><path d="${WSTAR}"/></svg>`).join('')}</div>`:''}
       ${here?`<span class="wMe">${av(k)}</span>`:''}
       <button class="wNode" data-journey="${J.id}" aria-label="${esc(L('journey',j+1)+': '+tr(J.t))}">${s==='done'?I('check'):s==='locked'?I('lock'):`<b>${j+1}</b>`}</button>
       <span class="wSign"><b>${L('journey',j+1)}</b>${esc(tr(J.t))}</span></div>`}).join('')}
   <div class="wStop chest ${done===n?'open':''}" style="${pos(T)}"><span class="wChest">${I('trophy')}</span></div></div></section>`;
}
/* ---------- cheer voices: a parent records "أحسنت! بارك الله فيك" etc. once; every child device plays it in the quiz ---------- */
const CHEERS=['ok','no','win'];
Object.assign(T.ar,{cheerTitle:'أصوات التشجيع في «العب»',cheerP:'سجّل بصوتك ما يسمعه الطفل في اللعبة، مثلاً: «أحسنت! بارك الله فيك». إن لم تسجّل، يُستخدم صوت الجهاز إن كان فيه صوت عربي.',
  ch_ok:'عند الإجابة الصحيحة',ch_okH:'مثلاً: أحسنت! بارك الله فيك',ch_no:'عند الإجابة الخاطئة',ch_noH:'مثلاً: لا بأس، حاول مرة أخرى',ch_win:'عند إنهاء الرحلة',ch_winH:'مثلاً: ما شاء الله! أنهيت الرحلة',
  rec:'تسجيل',recStop:'إيقاف وحفظ',recOn:'يسجّل الآن… تكلّم',recSaved:'حُفظ الصوت وسيُسمع في اللعبة',noMic:'لم نستطع الوصول إلى الميكروفون. اسمح للتطبيق باستخدامه أو ارفع ملفاً صوتياً',recNone:'لا يوجد تسجيل',recHave:'مسجّل'});
Object.assign(T.en,{cheerTitle:'Cheer voices in Play',cheerP:'Record what your child hears in the game, like "Well done!". Without a recording, the device voice is used when it has one for the app language.',
  ch_ok:'Right answer',ch_okH:'e.g. Well done!',ch_no:'Wrong answer',ch_noH:"e.g. That's okay, try again",ch_win:'Journey finished',ch_winH:'e.g. Amazing, you finished the journey!',
  rec:'Record',recStop:'Stop and save',recOn:'Recording… speak now',recSaved:'Saved; it will play in the game',noMic:"We couldn't use the microphone. Allow it, or upload an audio file",recNone:'Not recorded',recHave:'Recorded'});

function cheerView(){const c=S.cheer||{};
  return `<section class="panel glass cheerBox"><h3><span class="chip" style="background:linear-gradient(135deg,#4FD8A8,#1E9E86)">${I('speaker')}</span>${L('cheerTitle')}</h3>
   <p class="cheerP">${L('cheerP')}</p>
   ${CHEERS.map(s=>{const on=recSlot===s;return `<div class="cheerRow ${c[s]?'have':''}"><div><b>${L('ch_'+s)}</b><small>${on?L('recOn'):c[s]?I('check')+' '+L('recHave'):L('ch_'+s+'H')}</small></div>
     <div class="row"><button class="btn ${on?'no':'go'} sm" data-crec="${s}">${on?I('check')+L('recStop'):I('speaker')+L('rec')}</button>
     <button class="btn sun sm" data-cup="${s}">${I('upload')}</button>${c[s]?`<button class="btn sun sm" data-cplay="${s}" aria-label="${L('testSnd')}">${I('play')}</button><button class="ico del" data-cdel="${s}" aria-label="${L('del')}">${I('trash')}</button>`:''}</div></div>`}).join('')}
  </section>`}

let recSlot=null,recMR=null,recTimer=null;
async function recToggle(slot){
  if(recSlot){recMR?.stop();return}
  let stream;try{stream=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e){toast(L('noMic'));return}
  const chunks=[];let mr;try{mr=new MediaRecorder(stream)}catch(e){stream.getTracks().forEach(t=>t.stop());toast(L('noMic'));return}
  mr.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
  mr.onstop=()=>{clearTimeout(recTimer);stream.getTracks().forEach(t=>t.stop());const s=slot;recSlot=null;recMR=null;render();
    const blob=new Blob(chunks,{type:mr.mimeType||'audio/webm'});if(blob.size<800)return;const r=new FileReader();r.onload=()=>saveCheer(s,r.result);r.readAsDataURL(blob)};
  recSlot=slot;recMR=mr;mr.start();recTimer=setTimeout(()=>{if(mr.state==='recording')mr.stop()},6000);render();
}
function upCheer(slot){const inp=document.createElement('input');inp.type='file';inp.accept='audio/*';inp.onchange=()=>{const f=inp.files[0];if(!f)return;
  if(f.size>300*1024){toast(L('sndBig'));return}const r=new FileReader();r.onload=()=>saveCheer(slot,r.result);r.readAsDataURL(f)};inp.click()}
async function saveCheer(slot,data){const v=Date.now(),b=writeBatch(db);
  for(const k of F.kids)b.set(doc(logsCol(),`cheer_${slot}_${k.id}`),{kid:k.id,snd:data,date:'snd',status:'approved',v});
  b.update(famRef(),{['cheer.'+slot]:v});
  try{await b.commit();cheerMem[slot]=null;try{localStorage.setItem('najmati-ch-'+slot,JSON.stringify({v,d:data}))}catch(e){}toast(L('recSaved'))}catch(e){fail(e)}}
function delCheer(slot){const b=writeBatch(db);for(const k of F.kids)b.delete(doc(logsCol(),`cheer_${slot}_${k.id}`));b.update(famRef(),{['cheer.'+slot]:deleteField()});b.commit().catch(fail);cheerMem[slot]=null}

const cheerMem={};
async function cheerBuf(slot,kidId){
  const v=S.cheer?.[slot];if(!v)return null;const m=cheerMem[slot];if(m&&m.v===v)return m.buf;
  let data=null;try{const c=JSON.parse(localStorage.getItem('najmati-ch-'+slot)||'null');if(c&&c.v===v)data=c.d}catch(e){}
  if(!data){const id=M.role==='kid'?M.kid:(kidId||S.kids[0]?.id);if(!id)return null;const s=await getDoc(doc(logsCol(),`cheer_${slot}_${id}`));data=s.data()?.snd;if(!data)return null;try{localStorage.setItem('najmati-ch-'+slot,JSON.stringify({v,d:data}))}catch(e){}}
  const buf=await actx().decodeAudioData(await (await fetch(data)).arrayBuffer());cheerMem[slot]={v,buf};return buf}
function preloadCheers(kidId){CHEERS.forEach(s=>cheerBuf(s,kidId).catch(()=>{}))}
/* the parent's recording when there is one, otherwise the device voice in the app's language */
async function cheer(slot,text,delay=250){
  try{const buf=await cheerBuf(slot,QS?.k);if(buf){const c=actx(),src=c.createBufferSource(),g=c.createGain();g.gain.value=1.4;src.buffer=buf;src.connect(g).connect(c.destination);src.start(c.currentTime+delay/1000);return}}catch(e){console.error(e)}
  if(text)setTimeout(()=>say(text),delay)}
const cv=$('#sky'),cx=cv.getContext('2d');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let W,H,dpr,items=[];
const rnd=(a,b)=>a+Math.random()*(b-a);
const COLORS=['#FF6B8E','#FFB51F','#2D8CF0','#1FB57A','#A66BFF','#FF8A3D'];
/* ---------- themed backgrounds ---------- */
let SK={};
function buildSkin(){SK={stars:[],bub:[],fish:[],rings:[],cubes:[],bld:[],streaks:[],clouds:[]};
  for(let i=0;i<Math.round(W*H/12000);i++)SK.stars.push({x:rnd(0,W),y:rnd(0,H*.75),r:rnd(.6,2),p:rnd(0,6.3),s:rnd(.6,2)});
  let x=0;while(x<W){const w=rnd(50,110),h=rnd(H*.12,H*.3),win=[];for(let yy=12;yy<h-10;yy+=18)for(let xx=8;xx<w-10;xx+=16)win.push([xx,yy,Math.random()<.45]);SK.bld.push({x,w,h,win});x+=w+rnd(2,8)}
  for(let i=0;i<22;i++)SK.bub.push({x:rnd(0,W),y:rnd(0,H),r:rnd(3,12),v:rnd(.3,1),p:rnd(0,6)});
  const fc=['#FF8A3D','#FFD23F','#FF5D8F','#4DD6FF','#9B7BFF'];for(let i=0;i<7;i++)SK.fish.push({x:rnd(0,W),y:rnd(H*.15,H*.8),s:rnd(.7,1.5),v:rnd(.4,1.2)*(Math.random()<.5?-1:1),c:fc[i%5],p:rnd(0,6)});
  for(let i=0;i<9;i++)SK.rings.push({x:rnd(0,W),y:rnd(H*.1,H*.7),p:rnd(0,6),v:rnd(.3,.8),c:i%2?'#E8352B':'#2F6BFF'});
  for(let i=0;i<14;i++)SK.streaks.push({x:rnd(0,W),y:rnd(0,H*.8),l:rnd(60,200),v:rnd(6,14)});
  const cc=['#E8352B','#2F80ED','#F2C94C','#27AE60','#9B51E0','#F2994A'];for(let i=0;i<9;i++)SK.cubes.push({x:rnd(0,W),y:rnd(H*.1,H*.75),s:rnd(14,30),c:cc[i%6],p:rnd(0,6),v:rnd(.1,.35)});
  for(let i=0;i<5;i++)SK.clouds.push({x:rnd(0,W),y:rnd(30,H*.45),w:(rnd(4,8)|0),v:rnd(.1,.3)});
}
function shade(h,a){const n=parseInt(h.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const f=a<0?0:255,p=Math.abs(a);r=Math.round((f-r)*p+r);g=Math.round((f-g)*p+g);b=Math.round((f-b)*p+b);return `rgb(${r},${g},${b})`}
function twinkle(t,sq){for(const s of SK.stars){cx.globalAlpha=.3+.7*Math.abs(Math.sin(t/1000*s.s+s.p));cx.fillStyle='#fff';if(sq)cx.fillRect(s.x,s.y,s.r*2,s.r*2);else{cx.beginPath();cx.arc(s.x,s.y,s.r,0,7);cx.fill()}}cx.globalAlpha=1}
function orb(dark,sq){const mx=Math.max(70,W*.08),my=170;const g=cx.createRadialGradient(mx,my,10,mx,my,120);g.addColorStop(0,dark?'rgba(255,240,200,.25)':'rgba(255,220,90,.5)');g.addColorStop(1,'rgba(255,220,90,0)');cx.fillStyle=g;cx.fillRect(mx-120,my-120,240,240);
  cx.fillStyle=dark?'#F6F0D2':'#FFD34D';if(sq)cx.fillRect(mx-32,my-32,64,64);else{cx.beginPath();cx.arc(mx,my,34,0,7);cx.fill()}}
function webAt(x0,y0,R,rot,dark){cx.save();cx.translate(x0,y0);cx.strokeStyle=dark?'rgba(255,255,255,.3)':'rgba(25,35,90,.22)';cx.lineWidth=1.5;const n=12;
  for(let i=0;i<n;i++){const a=rot+i*Math.PI*2/n;cx.beginPath();cx.moveTo(0,0);cx.lineTo(Math.cos(a)*R,Math.sin(a)*R);cx.stroke()}
  for(let r=R/6;r<=R+1;r+=R/6){cx.beginPath();for(let i=0;i<=n;i++){const a=rot+i*Math.PI*2/n,x=Math.cos(a)*r,y=Math.sin(a)*r;if(!i)cx.moveTo(x,y);else{const pa=rot+(i-.5)*Math.PI*2/n;cx.quadraticCurveTo(Math.cos(pa)*r*.86,Math.sin(pa)*r*.86,x,y)}}cx.stroke()}cx.restore()}
function cube(x,y,s,c){const h=s*.5;cx.fillStyle=shade(c,.35);cx.beginPath();cx.moveTo(x,y-h);cx.lineTo(x+s,y);cx.lineTo(x,y+h);cx.lineTo(x-s,y);cx.closePath();cx.fill();
  cx.fillStyle=shade(c,-.25);cx.beginPath();cx.moveTo(x-s,y);cx.lineTo(x,y+h);cx.lineTo(x,y+h+s*1.1);cx.lineTo(x-s,y+s*1.1);cx.closePath();cx.fill();
  cx.fillStyle=c;cx.beginPath();cx.moveTo(x+s,y);cx.lineTo(x,y+h);cx.lineTo(x,y+h+s*1.1);cx.lineTo(x+s,y+s*1.1);cx.closePath();cx.fill()}
function drawSkin(t,dark){
  if(pal==='web'){if(dark)twinkle(t);orb(dark);
    webAt(0,0,Math.min(W,H)*.34,t/30000,dark);webAt(W,H*.22,Math.min(W,H)*.24,-t/36000,dark);
    for(const r of SK.rings){r.y-=r.v*.6;if(r.y<-20){r.y=H+20;r.x=rnd(0,W)}cx.globalAlpha=.8;cx.fillStyle=r.c;starPath(r.x,r.y,9,r.p+t/3000);cx.fill();cx.globalAlpha=1}
    for(const b of SK.bld){const y=H-b.h;cx.fillStyle=dark?'#0A1230':'rgba(35,55,125,.42)';cx.fillRect(b.x,y,b.w,b.h);for(const w of b.win){cx.fillStyle=dark?(w[2]?'#FFD66B':'rgba(255,255,255,.06)'):(w[2]?'rgba(255,255,255,.6)':'rgba(255,255,255,.18)');cx.fillRect(b.x+w[0],y+w[1],8,10)}}
  }else if(pal==='sea'){
    if(!dark){cx.save();cx.globalAlpha=.13;cx.fillStyle='#fff';for(let i=0;i<5;i++){const x0=W*(.12+i*.2)+Math.sin(t/3000+i)*20;cx.beginPath();cx.moveTo(x0,0);cx.lineTo(x0+60,0);cx.lineTo(x0-80,H);cx.lineTo(x0-180,H);cx.fill()}cx.restore()}else twinkle(t);
    for(let i=0;i<9;i++){const bx=(i+.5)*W/9+((i*37)%30);cx.strokeStyle=i%2?'#2FA36B':'#5CCB6E';cx.lineWidth=7;cx.lineCap='round';cx.beginPath();cx.moveTo(bx,H-45);for(let j=1;j<=7;j++)cx.lineTo(bx+Math.sin(t/900+j*.8+i)*10,H-45-j*18);cx.stroke()}
    const sg=cx.createLinearGradient(0,H-70,0,H);sg.addColorStop(0,dark?'#6B5630':'#F6DA92');sg.addColorStop(1,dark?'#3E3220':'#E2B86A');cx.fillStyle=sg;cx.beginPath();cx.moveTo(0,H-48);for(let x=0;x<=W;x+=60)cx.quadraticCurveTo(x+30,H-64,x+60,H-48);cx.lineTo(W,H);cx.lineTo(0,H);cx.fill();
    for(const f of SK.fish){f.x+=f.v;if(f.v>0&&f.x>W+60)f.x=-60;if(f.v<0&&f.x<-60)f.x=W+60;const y=f.y+Math.sin(t/800+f.p)*8;cx.save();cx.translate(f.x,y);cx.scale(f.v>0?f.s:-f.s,f.s);
      cx.fillStyle=f.c;cx.beginPath();cx.ellipse(0,0,22,13,0,0,7);cx.fill();cx.beginPath();cx.moveTo(-18,0);cx.lineTo(-34,-12);cx.lineTo(-34,12);cx.closePath();cx.fill();
      cx.fillStyle='#fff';cx.beginPath();cx.arc(10,-3,4.5,0,7);cx.fill();cx.fillStyle='#16324A';cx.beginPath();cx.arc(11,-3,2.2,0,7);cx.fill();cx.restore()}
    for(const b of SK.bub){b.y-=b.v;if(b.y<-20){b.y=H+20;b.x=rnd(0,W)}const x=b.x+Math.sin(t/700+b.p)*6;cx.strokeStyle='rgba(255,255,255,.75)';cx.lineWidth=1.5;cx.beginPath();cx.arc(x,b.y,b.r,0,7);cx.stroke();cx.fillStyle='rgba(255,255,255,.5)';cx.beginPath();cx.arc(x-b.r*.35,b.y-b.r*.35,b.r*.25,0,7);cx.fill()}
  }else if(pal==='speed'){if(dark)twinkle(t);orb(dark);
    cx.lineCap='round';for(const s of SK.streaks){s.x-=s.v;if(s.x+s.l<0){s.x=W+rnd(0,200);s.y=rnd(0,H*.8)}const g=cx.createLinearGradient(s.x,0,s.x+s.l,0);g.addColorStop(0,'rgba(255,255,255,.65)');g.addColorStop(1,'rgba(255,255,255,0)');cx.strokeStyle=g;cx.lineWidth=3;cx.beginPath();cx.moveTo(s.x,s.y);cx.lineTo(s.x+s.l,s.y);cx.stroke()}
    for(const r of SK.rings){r.x-=r.v;if(r.x<-30)r.x=W+30;const y=r.y+Math.sin(t/600+r.p)*6,w=Math.abs(Math.cos(t/400+r.p))*14+2;cx.lineWidth=6;cx.strokeStyle='#D99A00';cx.beginPath();cx.ellipse(r.x,y,w,16,0,0,7);cx.stroke();cx.lineWidth=2.5;cx.strokeStyle='#FFE873';cx.beginPath();cx.ellipse(r.x,y,w,16,0,0,7);cx.stroke()}
    const off=t/30,sz=28,shift=off%(sz*2);cx.save();cx.beginPath();cx.moveTo(0,H);for(let x=0;x<=W+10;x+=10)cx.lineTo(x,H-110+Math.sin((x+off)/140)*28);cx.lineTo(W,H);cx.closePath();cx.clip();
    let row=0;for(let y=H-150;y<H;y+=sz,row++){let i=0;for(let x=-shift;x<W;x+=sz,i++){const top=y<H-80;cx.fillStyle=top?((row+i)%2?'#3DBE4A':'#2E9A3A'):((row+i)%2?'#C8742B':'#9A5420');if(dark)cx.globalAlpha=.75;cx.fillRect(x,y,sz,sz);cx.globalAlpha=1}}cx.restore();
  }else if(pal==='blocks'){if(dark)twinkle(t,true);orb(dark,true);
    if(!dark)for(const c of SK.clouds){c.x-=c.v;if(c.x<-200)c.x=W+50;cx.fillStyle='rgba(255,255,255,.92)';const q=20;for(let i=0;i<c.w;i++)cx.fillRect(c.x+i*q,c.y,q,q);for(let i=1;i<c.w-1;i++)cx.fillRect(c.x+i*q,c.y-q,q,q)}
    for(const c of SK.cubes){c.y-=c.v;if(c.y<-60){c.y=H+40;c.x=rnd(0,W)}cube(c.x,c.y+Math.sin(t/900+c.p)*5,c.s,c.c)}
    const q=36;for(let x=0,i=0;x<W;x+=q,i++){cx.fillStyle=dark?'#4E3220':'#7A4E2D';cx.fillRect(x,H-q,q,q);cx.fillStyle=dark?'#3E8A2A':'#5DBB3F';cx.fillRect(x,H-q,q,10);cx.fillStyle=dark?'#2F6E20':'#4A9A31';cx.fillRect(x+(i%3)*8,H-q+10,8,6);cx.fillStyle=dark?'#3A2414':'#5E3A20';cx.fillRect(x+6+(i%2)*14,H-q+20,6,6)}
  }
}

function build(){
  dpr=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;cx.setTransform(dpr,0,0,dpr,0,0);
  items=[];const n=Math.round(W*H/9000);
  for(let i=0;i<n;i++)items.push({k:'dot',x:rnd(0,W),y:rnd(0,H),r:rnd(.6,2),p:rnd(0,6.3),s:rnd(.6,2)});
  for(let i=0;i<5;i++)items.push({k:'cloud',x:rnd(0,W),y:rnd(20,H*.6),s:rnd(.6,1.3),v:rnd(.08,.25)});
  for(let i=0;i<10;i++)items.push({k:'star',x:rnd(0,W),y:rnd(0,H),r:rnd(6,14),c:COLORS[i%6],v:rnd(.15,.4),a:rnd(0,6.3),va:rnd(-.01,.01)});
  for(let i=0;i<5;i++)items.push({k:'balloon',x:rnd(0,W),y:rnd(0,H),r:rnd(14,24),c:COLORS[(i+2)%6],v:rnd(.2,.45),p:rnd(0,6.3)});
  for(let i=0;i<3;i++)items.push({k:'planet',x:rnd(0,W),y:rnd(0,H),r:rnd(10,22),c:COLORS[(i*2+1)%6],v:rnd(.05,.15)});
  items.push({k:'rocket',x:rnd(0,W),y:H+60,v:.6});buildSkin();
}
function starPath(x,y,r,a){cx.beginPath();for(let i=0;i<10;i++){const rr=i%2?r*.45:r,an=a+i*Math.PI/5-Math.PI/2;cx.lineTo(x+Math.cos(an)*rr,y+Math.sin(an)*rr)}cx.closePath()}
let shoot=null,t0=0;
function frame(t){
  const dark=isDark();cx.clearRect(0,0,W,H);
  if(pal!=='royal'){drawSkin(t,dark);if(!reduce)requestAnimationFrame(frame);return}
  // sun or moon
  const mx=Math.max(70,W*.08),my=170;
  if(dark){cx.fillStyle='#FFF3C9';cx.beginPath();cx.arc(mx,my,34,0,7);cx.fill();cx.globalCompositeOperation='destination-out';cx.beginPath();cx.arc(mx+16,my-10,30,0,7);cx.fill();cx.globalCompositeOperation='destination-over';
    const g=cx.createRadialGradient(mx,my,10,mx,my,110);g.addColorStop(0,'rgba(255,240,200,.3)');g.addColorStop(1,'rgba(255,240,200,0)');cx.fillStyle=g;cx.fillRect(mx-110,my-110,220,220);cx.globalCompositeOperation='source-over'}
  else{const g=cx.createRadialGradient(mx,my,10,mx,my,140);g.addColorStop(0,'rgba(255,220,90,.6)');g.addColorStop(1,'rgba(255,220,90,0)');cx.fillStyle=g;cx.fillRect(mx-140,my-140,280,280);
    cx.save();cx.translate(mx,my);cx.rotate(t/6000);cx.strokeStyle='rgba(255,190,40,.7)';cx.lineWidth=4;cx.lineCap='round';for(let i=0;i<12;i++){cx.rotate(Math.PI/6);cx.beginPath();cx.moveTo(48,0);cx.lineTo(62,0);cx.stroke()}cx.restore();
    cx.fillStyle='#FFD34D';cx.beginPath();cx.arc(mx,my,38,0,7);cx.fill()}
  for(const o of items){
    if(o.k==='dot'&&dark){cx.globalAlpha=.35+.65*Math.abs(Math.sin(t/1000*o.s+o.p));cx.fillStyle='#fff';cx.beginPath();cx.arc(o.x,o.y,o.r,0,7);cx.fill();cx.globalAlpha=1}
    if(o.k==='cloud'&&!dark){o.x-=o.v;if(o.x<-160)o.x=W+160;cx.fillStyle='rgba(255,255,255,.85)';cx.beginPath();const s=o.s;cx.arc(o.x,o.y,26*s,0,7);cx.arc(o.x+30*s,o.y-12*s,32*s,0,7);cx.arc(o.x+64*s,o.y,24*s,0,7);cx.rect(o.x,o.y,64*s,24*s);cx.fill()}
    if(o.k==='star'){o.y-=o.v;o.a+=o.va;if(o.y<-20){o.y=H+20;o.x=rnd(0,W)}cx.globalAlpha=dark?.9:.7;cx.fillStyle=dark?'#FFD66B':o.c;starPath(o.x,o.y,o.r,o.a);cx.fill();cx.globalAlpha=1}
    if(o.k==='balloon'&&!dark){o.y-=o.v;if(o.y<-60){o.y=H+60;o.x=rnd(0,W)}const sx=o.x+Math.sin(t/1400+o.p)*12;cx.strokeStyle='rgba(22,50,74,.35)';cx.lineWidth=1.2;cx.beginPath();cx.moveTo(sx,o.y+o.r*1.2);cx.quadraticCurveTo(sx+8,o.y+o.r*2,sx,o.y+o.r*2.8);cx.stroke();
      cx.fillStyle=o.c;cx.beginPath();cx.ellipse(sx,o.y,o.r,o.r*1.2,0,0,7);cx.fill();cx.fillStyle='rgba(255,255,255,.45)';cx.beginPath();cx.ellipse(sx-o.r*.35,o.y-o.r*.4,o.r*.22,o.r*.34,-.5,0,7);cx.fill()}
    if(o.k==='planet'&&dark){o.y-=o.v;if(o.y<-40){o.y=H+40;o.x=rnd(0,W)}cx.fillStyle=o.c;cx.beginPath();cx.arc(o.x,o.y,o.r,0,7);cx.fill();cx.strokeStyle='rgba(255,255,255,.55)';cx.lineWidth=2;cx.beginPath();cx.ellipse(o.x,o.y,o.r*1.7,o.r*.45,-.4,0,7);cx.stroke()}
    if(o.k==='rocket'&&dark){o.y-=o.v;o.x+=o.v*.4;if(o.y<-80){o.y=H+80;o.x=rnd(0,W*.7)}cx.save();cx.translate(o.x,o.y);cx.rotate(.38);
      cx.fillStyle='rgba(255,160,60,'+(.5+.5*Math.random())+')';cx.beginPath();cx.moveTo(-6,18);cx.lineTo(0,34+Math.random()*8);cx.lineTo(6,18);cx.fill();
      cx.fillStyle='#F2F6FF';cx.beginPath();cx.moveTo(0,-22);cx.quadraticCurveTo(12,-6,9,18);cx.lineTo(-9,18);cx.quadraticCurveTo(-12,-6,0,-22);cx.fill();
      cx.fillStyle='#FF6B5A';cx.beginPath();cx.moveTo(-9,8);cx.lineTo(-16,20);cx.lineTo(-9,18);cx.fill();cx.beginPath();cx.moveTo(9,8);cx.lineTo(16,20);cx.lineTo(9,18);cx.fill();
      cx.fillStyle='#4DA3FF';cx.beginPath();cx.arc(0,-4,4.5,0,7);cx.fill();cx.restore()}
  }
  if(dark){if(!shoot&&Math.random()<.004)shoot={x:rnd(W*.3,W),y:rnd(0,H*.4),l:0};
    if(shoot){shoot.l+=14;const g=cx.createLinearGradient(shoot.x,shoot.y,shoot.x-shoot.l*.8,shoot.y+shoot.l*.4);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(1,'rgba(255,255,255,0)');cx.strokeStyle=g;cx.lineWidth=2;cx.beginPath();cx.moveTo(shoot.x,shoot.y);cx.lineTo(shoot.x-Math.min(shoot.l,160)*.8,shoot.y+Math.min(shoot.l,160)*.4);cx.stroke();shoot.x-=8;shoot.y+=4;if(shoot.l>320)shoot=null}}
  if(!reduce)requestAnimationFrame(frame);
}

/* ---------- helper buddy: a cartoon per theme that walks to the task due now and says what to do ---------- */
const BUDDY={
 royal:`<svg viewBox="0 0 64 64"><g class="bob"><path d="M32 4l8 16.5 18 2.6-13 12.7 3.1 17.9L32 45.3l-16.1 8.4L19 35.8 6 23.1l18-2.6z" fill="#FFC93C" stroke="#E59A00" stroke-width="2.5" stroke-linejoin="round"/><circle cx="26" cy="29" r="3.4" fill="#2B1B12"/><circle cx="38" cy="29" r="3.4" fill="#2B1B12"/><circle cx="27.2" cy="27.8" r="1.1" fill="#fff"/><circle cx="39.2" cy="27.8" r="1.1" fill="#fff"/><circle cx="22" cy="35" r="2.6" fill="#FF8FA3" opacity=".7"/><circle cx="42" cy="35" r="2.6" fill="#FF8FA3" opacity=".7"/><path d="M27 36q5 4.5 10 0" stroke="#8E3F2A" stroke-width="2.4" fill="none" stroke-linecap="round"/></g></svg>`,
 web:`<svg viewBox="0 0 64 64"><g class="legs" stroke="#1E2140" stroke-width="3" stroke-linecap="round" fill="none"><path class="l1" d="M22 30q-10-6-14-1M22 35q-11-1-15 6M23 39q-8 4-10 12M25 26q-6-9-12-9"/><path class="l2" d="M42 30q10-6 14-1M42 35q11-1 15 6M41 39q8 4 10 12M39 26q6-9 12-9"/></g><ellipse cx="32" cy="34" rx="13" ry="14" fill="#2F3366"/><ellipse cx="32" cy="34" rx="13" ry="14" fill="url(#wg)" opacity=".5"/><defs><radialGradient id="wg" cx=".35" cy=".3"><stop offset="0" stop-color="#7C86FF"/><stop offset="1" stop-color="#2F3366" stop-opacity="0"/></radialGradient></defs><ellipse cx="26.5" cy="31" rx="5" ry="5.6" fill="#fff"/><ellipse cx="37.5" cy="31" rx="5" ry="5.6" fill="#fff"/><circle cx="27.5" cy="32" r="2.6" fill="#1B1B2F"/><circle cx="38.5" cy="32" r="2.6" fill="#1B1B2F"/><circle cx="28.3" cy="31" r=".9" fill="#fff"/><circle cx="39.3" cy="31" r=".9" fill="#fff"/><path d="M28 40q4 3 8 0" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="22.5" cy="38" r="2.2" fill="#FF6B8E" opacity=".75"/><circle cx="41.5" cy="38" r="2.2" fill="#FF6B8E" opacity=".75"/></svg>`,
 sea:`<svg viewBox="0 0 64 64"><g class="bob"><path class="tail" d="M12 32L2 22v20z" fill="#FF7A2F"/><ellipse cx="34" cy="32" rx="22" ry="16" fill="#FF8A3D"/><path d="M30 17c4-6 10-6 13-2-5 0-9 1-13 2z" fill="#FF6A1F"/><path d="M22 26v12M27 22v20" stroke="#fff" stroke-width="3.5" opacity=".8"/><circle cx="45" cy="28" r="6.5" fill="#fff"/><circle cx="46.5" cy="28.5" r="3.4" fill="#16324A"/><circle cx="47.6" cy="27.3" r="1.1" fill="#fff"/><path d="M47 38q4 2 7-1" stroke="#8E3F1A" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="40" cy="36" r="2.3" fill="#FF6B8E" opacity=".7"/></g></svg>`,
 speed:`<svg viewBox="0 0 64 64"><g class="speedlines" stroke="#7FC8FF" stroke-width="3" stroke-linecap="round"><path d="M4 26h9M2 33h10M5 40h8"/></g><g class="bob"><circle cx="34" cy="30" r="17" fill="#2F6BFF"/><circle cx="34" cy="30" r="17" fill="url(#sg)" opacity=".55"/><defs><radialGradient id="sg" cx=".35" cy=".3"><stop offset="0" stop-color="#9CC2FF"/><stop offset="1" stop-color="#2F6BFF" stop-opacity="0"/></radialGradient></defs><ellipse cx="34" cy="35" rx="10" ry="7.5" fill="#FFE2C4"/><ellipse cx="29" cy="27" rx="4.3" ry="5" fill="#fff"/><ellipse cx="39" cy="27" rx="4.3" ry="5" fill="#fff"/><circle cx="30" cy="28" r="2.3" fill="#16324A"/><circle cx="40" cy="28" r="2.3" fill="#16324A"/><path d="M30 37q4 3 8 0" stroke="#8E3F2A" stroke-width="2.2" fill="none" stroke-linecap="round"/></g><g class="legs"><path class="l1" d="M27 46l-3 8h9z" fill="#E8352B"/><path class="l2" d="M39 46l-1 8h9z" fill="#E8352B"/><path d="M24 54h9M38 54h9" stroke="#fff" stroke-width="2"/></g></svg>`,
 blocks:`<svg viewBox="0 0 64 64"><g class="bob"><rect x="18" y="4" width="4" height="8" fill="#7A7A7A"/><rect x="16" y="2" width="8" height="5" fill="#E8352B"/><rect x="12" y="12" width="40" height="32" fill="#5DBB3F"/><rect x="12" y="12" width="40" height="6" fill="#7CD65A"/><rect x="12" y="40" width="40" height="4" fill="#3E8A2A"/><rect x="20" y="22" width="8" height="8" fill="#fff"/><rect x="36" y="22" width="8" height="8" fill="#fff"/><rect x="23" y="25" width="5" height="5" fill="#16324A"/><rect x="39" y="25" width="5" height="5" fill="#16324A"/><rect x="26" y="34" width="12" height="3" fill="#2E5E1E"/><rect x="24" y="32" width="3" height="3" fill="#2E5E1E"/><rect x="37" y="32" width="3" height="3" fill="#2E5E1E"/></g><g class="legs"><rect class="l1" x="20" y="44" width="8" height="12" fill="#7A4E2D"/><rect class="l2" x="36" y="44" width="8" height="12" fill="#7A4E2D"/></g></svg>`
};
Object.assign(T.ar,{
  bPray:(t,f)=>`حان وقت ${t}! بعد ما ${f?'تصلين اضغطي':'تصلي اضغط'} عليها`,
  bDue:(t,f)=>`حان وقت «${t}». ${f?'اضغطي':'اضغط'} عليها لما ${f?'تخلصين':'تخلص'}`,
  bNext:(t,h)=>`المهمة التالية: «${t}» الساعة ${h}`,
  bAll:(f)=>`ما شاء الله! ${f?'أنجزتِ':'أنجزت'} كل مهام اليوم`,
  bWait:'طلباتك عند ماما أو بابا، انتظر الاعتماد',bHide:'إخفاء المساعد',bShow:'إظهار المساعد'});
Object.assign(T.en,{
  bPray:t=>`It's time for ${t}! Tap it after you pray`,bDue:t=>`Time for “${t}”. Tap it when you finish`,
  bNext:(t,h)=>`Next: “${t}” at ${h}`,bAll:()=>`Amazing! You finished all of today's tasks`,
  bWait:'Your requests are with Mom or Dad',bHide:'Hide helper',bShow:'Show helper'});

let buddyOff=false;try{buddyOff=localStorage.getItem('najmati-buddy')==='off'}catch(e){}
let buddyKey='',buddyMsgAt=0;
function buddyEl(){let b=$('#buddy');if(b)return b;
  b=document.createElement('div');b.id='buddy';b.innerHTML='<span class="thread"></span><button class="bd" aria-label=""></button><div class="bubble" role="status"></div>';
  document.body.appendChild(b);b.style.transform=`translate(16px,${innerHeight-120}px)`;
  b.querySelector('.bd').addEventListener('click',e=>{e.stopPropagation();const t=b.dataset.target&&document.querySelector(`[data-task="${b.dataset.target}"]`);
    if(t){t.scrollIntoView({behavior:'smooth',block:'center'});t.classList.remove('buddyPing');void t.offsetWidth;t.classList.add('buddyPing')}
    b.classList.add('talk');buddyMsgAt=Date.now();b.classList.remove('hop');void b.offsetWidth;b.classList.add('hop')});
  return b}
function buddyFocus(k){
  const n=nowMin(),f=k.g==='f',list=todays(k.id);let pend=false;
  const st=t=>{const s=log(t.id,k.id)?.status;if(s==='approved')return 'done';if(s==='pending'){pend=true;return 'done'}
    if(t.pr){const p=prayerState(t).s;return p==='now'?'due':p==='missed'?'gone':'later'}
    const [h,m]=t.time.split(':').map(Number);return h*60+m<=n?'due':'later'};
  const ss=list.map(t=>[t,st(t)]);
  const due=ss.filter(x=>x[1]==='due').map(x=>x[0]).sort((a,b)=>(b.pr?1:0)-(a.pr?1:0));
  if(due[0]){const t=due[0];return {t,msg:t.pr?L('bPray',esc(tr(t.title)),f):L('bDue',esc(tr(t.title)),f),urgent:true}}
  const next=ss.find(x=>x[1]==='later');
  if(next)return {t:next[0],msg:L('bNext',esc(tr(next[0].title)),fmt(tm(next[0])))};
  return {t:null,msg:pend?L('bWait'):L('bAll',f),happy:!pend};
}
function placeBuddy(){
  const show=F&&M&&V.role==='kid'&&V.tab==='today'&&!buddyOff&&document.querySelector('.kidTabs');
  const b=$('#buddy');if(!show){if(b)b.hidden=true;return}
  const el=buddyEl();el.hidden=false;el.className='b-'+pal;
  const k=kid(V.kid);if(!k)return;const fo=buddyFocus(k);
  const bd=el.querySelector('.bd');bd.innerHTML=BUDDY[pal]||BUDDY.royal;bd.setAttribute('aria-label',fo.msg.replace(/<[^>]+>/g,''));
  const key=(fo.t?.id||'none')+'|'+fo.msg;
  document.querySelectorAll('.buddyFocus').forEach(x=>x.classList.remove('buddyFocus'));
  const card=fo.t&&document.querySelector(`[data-task="${fo.t.id}"]`);
  if(card&&fo.urgent)card.classList.add('buddyFocus');
  el.dataset.target=fo.t?.id||'';el._fo=fo;
  el.classList.toggle('happy',!!fo.happy);el.classList.toggle('urgent',!!fo.urgent);
  positionBuddy();
  el.querySelector('.bubble').innerHTML=`${fo.msg}<button class="bx" data-buddyoff="1" aria-label="${L('bHide')}">${I('x')}</button>`;
  /* the bubble talks when the focus changes, then rests; tapping the buddy brings it back */
  if(key!==buddyKey){buddyKey=key;buddyMsgAt=Date.now()}
  el.classList.toggle('talk',Date.now()-buddyMsgAt<12000);
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-buddyoff]');if(!b)return;e.stopPropagation();buddyOff=true;try{localStorage.setItem('najmati-buddy','off')}catch(x){}render()},true);
document.addEventListener('click',e=>{const b=e.target.closest('[data-buddyon]');if(!b)return;buddyOff=false;try{localStorage.removeItem('najmati-buddy')}catch(x){}buddyMsgAt=Date.now();render()});
/* the buddy stands on its task card when that card is on screen, otherwise it waits in the corner */
function positionBuddy(){const el=$('#buddy');if(!el||el.hidden)return;const id=el.dataset.target;const card=id&&document.querySelector(`[data-task="${id}"]`);
  let x,y,home=true;
  if(card){const r=card.getBoundingClientRect();if(r.top>70&&r.top<innerHeight-140){x=r.left+(lang==='ar'?r.width-70:6);y=r.top-46;home=false}}
  if(home){x=lang==='ar'?14:innerWidth-78;y=innerHeight-104}
  x=Math.max(4,Math.min(x,innerWidth-68));
  const t=`translate(${Math.round(x)}px,${Math.round(y)}px)`;
  if(el.style.transform!==t){el.classList.add('walk');el.style.transform=t;clearTimeout(el._w);el._w=setTimeout(()=>el.classList.remove('walk'),1500)}
  el.classList.toggle('flip',x<innerWidth/2);el.classList.toggle('home',home)}
let _bq=0;addEventListener('scroll',()=>{if(_bq)return;_bq=requestAnimationFrame(()=>{_bq=0;positionBuddy()})},{passive:true});
addEventListener('resize',()=>placeBuddy());
setInterval(()=>{const b=$('#buddy');if(b&&!b.hidden&&Date.now()-buddyMsgAt>12000)b.classList.remove('talk')},3000);
addEventListener('resize',build);
mq.addEventListener?.('change',applyTheme);
new MutationObserver(()=>{$('#mode').innerHTML=isDark()?I('sun'):I('moon');if(reduce)frame(0)}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});

$('#logo').innerHTML='<img src="icons/apple-touch-icon.png?v=2" alt="">';
applyLang();build();
if(CFG){gate.screen='loading';render();onAuthStateChanged(auth,u=>onUser(u))}else render();
setInterval(tick,60000);setInterval(adhanCheck,15000);setTimeout(adhanCheck,3000);requestAnimationFrame(frame);
if('serviceWorker' in navigator&&!EMU&&location.protocol==='https:')navigator.serviceWorker.register('sw.js');
