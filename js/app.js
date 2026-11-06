const { createApp, ref, computed, onMounted, watch, nextTick } = Vue;
        createApp({
            setup() {

                // 追蹤當前登入使用者狀態
const currentUser = ref(null);

// 1. Email 免密碼一鍵登入 (Magic Link)
const loginEmail = ref('');
const loginWithEmail = async () => {
    if (!loginEmail.value || !loginEmail.value.includes('@')) {
        return alert('請輸入有效的 Email 地址！');
    }
    const { error } = await supabase.auth.signInWithOtp({
        email: loginEmail.value,
        options: {
            // 請將這裡換成你目前實際開啟網頁的網址，例如 'https://iamrita5623.github.io/idolplanner'
            emailRedirectTo: window.location.origin + window.location.pathname, 
        }
    });
    if (error) alert("發送失敗: " + error.message);
    else alert("登入連結已發送到您的信箱，請至信箱點擊連結完成登入！");
};


// 2. 登出
const logout = async () => {
    await supabase.auth.signOut();
    currentUser.value = null;
    events.value = []; // 清空畫面
    alert('已成功登出');
};

// 3. 檢查目前是否已經登入，並自動把雲端資料抓下來或主動備份
/* 舊版讀取邏輯，已停用
const checkUserAndFetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        currentUser.value = user;
        
        // 從雲端抓取屬於這個使用者的行程資料
        const { data, error } = await supabase
            .from('idol_events')
            .select('*')
            .eq('user_id', user.id);
            
        if (data && data.length > 0 && data[0].event_data) {
            let rawData = data[0].event_data;
            
            // 🌟 自動解開被包多層的物件（例如 {"events": {"events": ...}}），直到找到陣列為止
            let parsedData = rawData;
            while (parsedData && typeof parsedData === 'object' && !Array.isArray(parsedData)) {
                if (parsedData.events) {
                    parsedData = parsedData.events;
                } else if (parsedData.event_data) {
                    parsedData = parsedData.event_data;
                } else {
                    break;
                }
            }
            
            // 如果成功解開成陣列，就放回畫面上
            if (Array.isArray(parsedData)) {
                events.value = parsedData;
                console.log("成功從雲端解析並還原行程資料！", events.value);
            } else {
                console.error("無法解析的雲端資料結構", rawData);
            }
        }
    }
};


*/
const checkUserAndFetchData = async () => {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (!user) return { status: 'signed_out' };
        if (authError) throw authError;
        currentUser.value = user;
        const { data, error } = await supabase.from('idol_events')
            .select('event_data').eq('user_id', user.id).maybeSingle();
        if (error) throw error;
        if (!data || data.event_data == null) {
            cloudReady.value = true;
            return { status: 'empty' };
        }
        const raw = data.event_data;
        let parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        for (let i = 0; i < 8 && parsed && !Array.isArray(parsed); i++) {
            if (typeof parsed !== 'object') break;
            if (Object.prototype.hasOwnProperty.call(parsed, 'events')) parsed = parsed.events;
            else if (Object.prototype.hasOwnProperty.call(parsed, 'event_data')) parsed = parsed.event_data;
            else break;
        }
        if (!Array.isArray(parsed)) throw new Error('雲端 event_data 格式無法辨識');
        events.value = parsed;
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
            if (Array.isArray(raw.fandoms)) fandoms.value = raw.fandoms;
            if (typeof raw.customTitle === 'string') customTitle.value = raw.customTitle;
            if (typeof raw.themeColor === 'string') themeColor.value = raw.themeColor;
            if (Number(raw.yearlyBudget) > 0) yearlyBudget.value = Number(raw.yearlyBudget);
        }
        cloudReady.value = true;
        return { status: 'loaded' };
    } catch (error) {
        cloudReady.value = false;
        console.error('雲端讀取失敗，停止自動寫入:', error);
        alert('雲端資料讀取失敗，已暫停雲端同步，請勿清除本機資料。');
        return { status: 'error' };
    }
};
// 網頁一開機時先檢查登入狀態
// 初始化由下方唯一的 onMounted 負責，避免重複抓取雲端資料。

                const events = ref([]);
const isInitializing = ref(true);
const cloudReady = ref(false);
const loadError = ref(false); // 🌟 開機防護：剛開機時禁止自動上傳覆蓋
                const selectedMapYear = ref('ALL');
                const activeTab = ref('home');
                const viewMode = ref('upcoming');
                const themeColor = ref('#63b3b0'); 
          
 
             const selectedYear = ref(new Date().getFullYear().toString());
                const expandedEventId = ref(null);
                const isYearlyPrivacy = ref(true); 
                const isEventPrivacy = ref(true); 

                const isSearching = ref(false);
                const searchError = ref('');
     
                
                const searchQuery = ref('');
                
                const showModal = ref(false);
                const showSettingsModal = ref(false); 
                
                const showImportModal = ref(false);
const openImportModal = () => { showImportModal.value = true; };
                const diagnoseImport = async () => {
                    try {
                        showImportModal.value = true;
                        await nextTick();
                        const node = document.querySelector('[data-import-dialog="true"]');
                        const visible = node ? getComputedStyle(node) : null;
                        const details = [
                            '匯入按鈕：事件已觸發',
                            'Vue 狀態：' + showImportModal.value,
                            '視窗 DOM：' + (node ? '存在' : '不存在'),
                            'display：' + (visible ? visible.display : '無'),
                            'visibility：' + (visible ? visible.visibility : '無'),
                            '尺寸：' + (node ? Math.round(node.getBoundingClientRect().width) + '×' + Math.round(node.getBoundingClientRect().height) : '無')
                        ].join('\\n');
                        alert('匯入診斷\\n' + details);
                    } catch(e) { alert('匯入診斷錯誤：' + (e && e.message ? e.message : String(e))); }
                };
                const showShareModal = ref(false);
                const shareBusy = ref(false);
                const shareError = ref('');
                const shareImagePreview = ref('');
                const recapQuotes = [
                    '這一年，因為每一次相見而閃閃發亮。',
                    '每一場奔赴，都是寫給青春的情書。',
                    '燈海熄滅以後，回憶依然發光。',
                    '跨越城市，只為與喜歡的你相見。',
                    '今年的每一次心動，都值得收藏。',
                    '下一次見面之前，先把今天珍藏。',
                    '那些一起合唱的夜晚，永遠不會散場。',
                    '用一張張門票，收藏一整年的幸福。'
                ];
                const recapQuote = ref(recapQuotes[0]);
                const rerollRecapQuote = () => {
                    const choices = recapQuotes.filter(q => q !== recapQuote.value);
                    recapQuote.value = choices[Math.floor(Math.random() * choices.length)];
                    shareImagePreview.value = '';
                };
                const openSharePreview = () => { rerollRecapQuote(); shareError.value = ''; showShareModal.value = true; };
                const shareDistanceAvailable = computed(() => events.value.filter(e => (selectedYear.value === 'ALL' || String(e.date || '').startsWith(String(selectedYear.value))) && e.lat != null && e.lng != null).length >= 2);
                const shareDistanceLabel = computed(() => shareDistanceAvailable.value ? String(totalDistance.value) : '—'); 
                const showTicketModal = ref(false);
                const showCalendarModal = ref(false); 
                const showChangelogModal = ref(false); 
                const showFandomModal = ref(false); 
                const calendarEvent = ref(null);     
  
                const ticketEvent = ref({});
                const isEditing = ref(false);
                const isFandomEditing = ref(false); 
                const editFandomIndex = ref(null); 
                const importJson = ref('');
                let map = null;
                let markers = [];

const isStatsPrivacy = ref(true); 
// 初始化預算，預設 50000
const yearlyBudget = ref(Number(localStorage.getItem('idolYearlyBudget')) || 50000); 

// 監聽並存入本地儲存
watch(yearlyBudget, (newVal) => localStorage.setItem('idolYearlyBudget', newVal));

// 級距碎碎念邏輯
const budgetNagging = computed(() => {
    const percent = (currentYearExpense.value / yearlyBudget.value) * 100;
    if (percent >= 100) return "⚠️ 預算炸裂！請開始吃土模式";
    if (percent >= 80) return "🚨 亮紅燈！再買要喝西北風了";
    if (percent >= 50) return "💡 預算過半，請謹慎評估行程";
    return "✨ 預算充裕，記得存錢唷！";
});

// 計算兩點間的球面距離 (Haversine 公式)
const calculateKm = window.IdolPlannerMap.calculateKm;

// 新增：根據年份計算過濾後的點位數量
const filteredMapEventsCount = computed(() => {
    // 1. 先根據年度過濾資料
    const target = selectedMapYear.value === 'ALL' 
        ? events.value 
        : events.value.filter(e => e.date && e.date.startsWith(selectedMapYear.value));

    // 2. 建立一個 Set 來儲存唯一的經緯度組合字串
    const uniqueLocations = new Set();
    
    target.forEach(e => {
        if (e.lat && e.lng) {
            // 將經緯度組合成字串作為 key，例如 "25.05_121.53"
            uniqueLocations.add(`${e.lat}_${e.lng}`);
        }
    });

    // 3. 回傳 Set 的大小，即為不重複的地點數量
    return uniqueLocations.size;
});


// 更新：totalDistance 也要隨著年份變動
const totalDistance = computed(() => {
    // 根據統計頁面選擇的年份過濾
    const targetYear = selectedMapYear.value; 
    const baseEvents = targetYear === 'ALL' 
        ? events.value 
        : events.value.filter(e => e.date && e.date.startsWith(targetYear));

    const validPoints = [...baseEvents]
        .filter(e => e.lat && e.lng)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    let dist = 0;
    for (let i = 0; i < validPoints.length - 1; i++) {
        dist += calculateKm(
            validPoints[i].lat, validPoints[i].lng,
            validPoints[i+1].lat, validPoints[i+1].lng
        );
    }
    return Math.round(dist); // 依照您的要求取整數位
});


                const defaultForm = {
                    id: null, title: '', artist: '', date: '', time: '19:00', location: '', 
                    seat: '', color: '#63b3b0', expenses: [], checklist: [], memo: '', lat: null, lng: null,
                    coverUrl: '', sticker: '',
                    useUrl: false
                };
                const form = ref({ ...defaultForm });
                const presetColors = ['#63b3b0', '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#1dd1a1'];
                const customTitle = ref(localStorage.getItem('appTitle') || '追星日記 ✨');
                const appVersion = ref('v1.0.7'); // 更新版本號
                
                // --- FANDOM STATES ---
                const fandoms = ref(JSON.parse(localStorage.getItem('fandomFandoms') || '[]'));
                const currentFandomIndex = ref(0);
                
                const defaultFandomForm = {
                    name: '',
                    date: '', 
                    sticker: '',
                    coverUrl: '',
                    birthday: '',
                    debutDate: '',
                    useUrl: false
                };
                const fandomForm = ref({...defaultFandomForm});
                // --- END FANDOM STATES ---

                const changelogContent = ref([ 
{
    version: 'v1.0.7',
    date: '2026/11/05',
    items: [
        '修正匯入視窗提示：貼上表格、上傳檔案及貼上 JSON 分別顯示對應說明。',
        '貼上表格新增欄位提示；上傳檔案標示 CSV、TSV、TXT、JSON 與 Excel 轉存 CSV 提醒。',
        '移除各模式共用的舊 JSON 輸入框範例，保留原有分享與資料儲存功能。'
    ]
},
{ 
    version: 'v1.0.6',
    date: '2026/11/02',
    items: [
        '新增 Supabase 雲端自動同步功能，支援多裝置資料備份。',
        '登入機制升級：改用 Email 免密碼快速登入 (Magic Link)。',
    ] 
},
{ 
    version: 'v1.0.5', 
    date: '2025/12/31', 
    items: [
        '新增地圖「追星里程」自動計算，累計所有行程間的移動距離。',
        '新增追星成就「分享長圖」功能，一鍵生成年度回顧美圖。',
        '新增年度追星預算設定與首頁進度條提醒。',
        '優化地圖 UI 佈局與年度篩選功能，並繪製歷史足跡標線。',
        '精細化隱私模式：可獨立切換首頁支出、行程細節與統計數據的金額屏蔽。'
    ] 
},
                    { version: 'v1.0.4', date: '2025/12/08', items: [
                        '新增封面圖片上傳彈性：行程與紀念日表單支援 Base64 檔案上傳（限制 1MB）或貼上圖片 URL 兩種模式。',
                        '優化 Base64 圖片預覽與清除邏輯。',
                        '修正儲存行程/紀念日時，移除非儲存需要的臨時狀態變數（如 useUrl）。',
                    ] },
                    { version: 'v1.0.3', date: '2025/12/06', items: [
                        '優化入坑紀念日卡片排版：將偶像名稱/Emoji和編輯按鈕移到圖片下方，確保所有內容不被圖片疊蓋。',
                        '修正出道日計算邏輯：現在同時顯示「出道年數」和「距離下一個紀念日倒數天數」。',
                        '修復生日/出道日當天，祝賀詞正確顯示，並避免顯示倒數天數。',
                        '修正入坑日卡片在沒有封面圖片時，文字區域會自動佔滿卡片空間，消除留白。'
                    ] },
                    { version: 'v1.0.2', date: '2025/12/05', items: [
                        '新增入坑紀念日編輯功能（鉛筆按鈕）。',
                        '入坑紀念日表單新增生日和出道日分離輸入欄位，並加入日期格式防呆。',
                        '修復票根頁面：去除封面圖上的應援色濾鏡，保持圖片原色。',
                        '優化入坑紀念日卡片：偶像名稱和 Emoji 樣式修正。'
                    ] },
                    { version: 'v1.0.1', date: '2025/12/05', items: [
                        '新增追星儀表板數據（統計場次、花費、熱門本命）。',
                        '新增資料匯入（JSON）和備份功能。',
                        '優化行程頁面搜索功能，提供即將到來和歷史回憶篩選。',
                    ] },
                    { version: 'v1.0.0', date: '2025/12/04', items: [
                        '初始版本發布，支援行程、費用、地圖紀錄。',
                        '新增主題色自適應功能。',
                        '優化加入日曆多選單。'
                    ] },
                ]);
                const saveFandoms = () => {
                    localStorage.setItem('fandomFandoms', JSON.stringify(fandoms.value));
                };

                const openFandomModal = () => {
                    isFandomEditing.value = false;
                    editFandomIndex.value = null;
                    fandomForm.value = {...defaultFandomForm, date: new Date().toLocaleDateString('sv-SE'), useUrl: false};
                    showFandomModal.value = true;
                };
                const editFandom = (fandom, index) => {
                    isFandomEditing.value = true;
                    editFandomIndex.value = index;
                    fandomForm.value = JSON.parse(JSON.stringify(fandom));
                    fandomForm.value.useUrl = (fandom.coverUrl && !fandom.coverUrl.startsWith('data:')) || false;
                    showFandomModal.value = true;
                };

                const closeFandomModal = () => {
                    showFandomModal.value = false;
                    fandomForm.value = {...defaultFandomForm};
                };

                const validateDate = (dateString) => {
                    if (!dateString) return true;
                    const regex = /^\d{4}-\d{2}-\d{2}$/;
                    if (!regex.test(dateString)) {
                        if (/^\d{8}$/.test(dateString)) {
                            const fixedDate = `${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}`;
                            const date = new Date(fixedDate);
                            return date instanceof Date && !isNaN(date);
                        }
                        return false;
                    }
                    
                    const date = new Date(dateString);
                    return date instanceof Date && !isNaN(date);
                };

                const addFandom = () => {
                    if (!fandomForm.value.name.trim()) {
                        return alert('錯誤：偶像名稱不能為空！');
                    }
                    if (!fandomForm.value.date) {
                         return alert('錯誤：入坑日期不能為空！');
                    }

                    if (!validateDate(fandomForm.value.date)) {
                        return alert('錯誤：入坑日期格式無效！請使用 YYYY-MM-DD 格式。');
                    }
                    if (fandomForm.value.birthday && !validateDate(fandomForm.value.birthday)) {
                        return alert('錯誤：生日日期格式無效！請使用 YYYY-MM-DD 格式。');
                    }
                    if (fandomForm.value.debutDate && !validateDate(fandomForm.value.debutDate)) {
                        return alert('錯誤：出道日期格式無效！請使用 YYYY-MM-DD 格式。');
                    }

                    const fandomToSave = JSON.parse(JSON.stringify(fandomForm.value));
                    delete fandomToSave.useUrl;

                    if(isFandomEditing.value && editFandomIndex.value !== null) {
                        fandoms.value[editFandomIndex.value] = fandomToSave;
                    } else {
                        fandoms.value.push(fandomToSave);
                    }
                    saveFandoms();
                    closeFandomModal();
                };

                const removeFandom = (index) => {
                    if (confirm('確定要刪除這個入坑紀念日嗎？此操作無法恢復。')) {
                        fandoms.value.splice(index, 1);
                        saveFandoms();
                    }
                };
                // 初始化 Supabase 客戶端
const supabaseUrl = 'https://glnucmilbncytgvrrjqo.supabase.co';
const supabaseKey = 'sb_publishable__MO1vZsdaOEP69qyaLbloA_D2Oal_Cr';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 範例：雲端同步開關（可以做個按鈕切換，或預設自動背景同步）
// 當畫面有異動時，除了原本的 localStorage，也能自動備份到 Supabase

const lastSyncTime = ref(''); // 宣告時間變數

/* 舊版同步邏輯，已停用
const syncToCloud = async (dataToSync) => {
    if (!currentUser.value) return;
    
    try {
        const currentTimeISO = new Date().toISOString();
        
        const { error } = await supabase
            .from('idol_events')
            .upsert({ 
                user_id: currentUser.value.id, 
                event_data: dataToSync,
                updated_at: currentTimeISO
            }, { 
                onConflict: 'user_id' 
            });

        if (!error) {
            // 成功同步後，把時間轉成好看的格式顯示在畫面上
            lastSyncTime.value = new Date(currentTimeISO).toLocaleTimeString();
        } else {
            console.error("雲端同步失敗:", error.message);
        }
    } catch (err) {
        console.error("同步發生異常:", err);
    }
};


*/
let cloudSyncTimer = null;
let cloudWriteQueue = Promise.resolve();
const syncToCloud = () => {
    if (isInitializing.value || !cloudReady.value || !currentUser.value) return;
    clearTimeout(cloudSyncTimer);
    cloudSyncTimer = setTimeout(() => {
        if (isInitializing.value || !cloudReady.value || !currentUser.value) return;
        const userId = currentUser.value.id;
        const snapshot = {
            schemaVersion: 2,
            events: JSON.parse(JSON.stringify(events.value)),
            fandoms: JSON.parse(JSON.stringify(fandoms.value)),
            customTitle: customTitle.value,
            themeColor: themeColor.value,
            yearlyBudget: yearlyBudget.value
        };
        cloudWriteQueue = cloudWriteQueue.catch(console.error).then(async () => {
            if (!cloudReady.value || !currentUser.value || currentUser.value.id !== userId) return;
            const now = new Date().toISOString();
            const { error } = await supabase.from('idol_events').upsert({
                user_id: userId, event_data: snapshot, updated_at: now
            }, { onConflict: 'user_id' });
            if (error) {
                console.error('雲端同步失敗:', error);
                alert('雲端儲存失敗，請先保留本機資料。');
            } else {
                lastSyncTime.value = new Date(now).toLocaleString('zh-TW');
            }
        });
    }, 1200);
};
/* 舊版重複監聽，已停用
// 讓原本的 watch 多執行一個雲端備份（或保留 localStorage 不變）
watch(events, (newVal) => {
    localStorage.setItem('idolEvents', JSON.stringify(newVal)); // 保留你原本的
    syncToCloud(newVal); // 默默在背景自動上傳雲端備份！
}, { deep: true });
  // 🌟 整合唯一的 onMounted，確保開機時正確讀取資料並關閉防護
onMounted(async () => {
    // 1. 先檢查登入狀態並嘗試從 Supabase 雲端抓取資料
    await checkUserAndFetchData();
    
    // 2. 如果雲端沒有資料，才退回讀取手機本機的 localStorage 作為備份
    if (!events.value || events.value.length === 0) {
        const savedEvents = localStorage.getItem('idolEvents');
        if (savedEvents) {
            try {
                events.value = JSON.parse(savedEvents);
            } catch (e) {
                console.error("解析本機資料失敗", e);
            }
        }
    }

    // 3. 🌟 關鍵：資料載入完成後，等待 0.5 秒再解除防護，防止自動覆蓋！
    setTimeout(() => {
        isInitializing.value = false;
    }, 500);
});
                
                watch(customTitle, (newVal) => localStorage.setItem('appTitle', newVal));
                watch(events, (newVal) => localStorage.setItem('idolEvents', JSON.stringify(newVal)), { deep: true });
                watch(themeColor, (newVal) => localStorage.setItem('idolTheme', newVal));
                
// 🌟 讓修改 App 標題時，同時存本機並備份到雲端
watch(customTitle, (newVal) => {
    localStorage.setItem('appTitle', newVal);
    syncToCloud({
        events: events.value,
        fandoms: fandoms.value,
        customTitle: newVal,
        yearlyBudget: yearlyBudget.value,
        themeColor: themeColor.value,
        updated_at: new Date().toISOString()
    });
});

// 行程原本的 watch（保留並加上雲端備份）
watch(events, (newVal) => {
    localStorage.setItem('idolEvents', JSON.stringify(newVal));
    syncToCloud(events.value); 
}, { deep: true });

// 🌟 讓修改主題顏色時，同時存本機並備份到雲端
watch(themeColor, (newVal) => {
    localStorage.setItem('idolTheme', newVal);
    syncToCloud({
        events: events.value,
        fandoms: fandoms.value,
        customTitle: customTitle.value,
        yearlyBudget: yearlyBudget.value,
        themeColor: newVal,
        updated_at: new Date().toISOString()
    });
});

// 🌟 讓修改年度預算時，同時存本機並備份到雲端
watch(yearlyBudget, (newVal) => {
    localStorage.setItem('idolYearlyBudget', newVal);
    syncToCloud({
        events: events.value,
        fandoms: fandoms.value,
        customTitle: customTitle.value,
        yearlyBudget: newVal,
        themeColor: themeColor.value,
        updated_at: new Date().toISOString()
    });
});


*/
onMounted(async () => {
    const result = await checkUserAndFetchData();
    loadError.value = result.status === 'error';
    if (result.status === 'signed_out') {
        try {
            const saved = JSON.parse(localStorage.getItem('idolGuestEvents') || '[]');
            if (Array.isArray(saved)) events.value = saved;
        } catch (error) {
            console.error('訪客暫存資料無法解析:', error);
        }
    }
    await nextTick();
    isInitializing.value = false;
});
const retryCloudLoad = async () => {
    isInitializing.value = true;
    loadError.value = false;
    const result = await checkUserAndFetchData();
    loadError.value = result.status === 'error';
    await nextTick();
    isInitializing.value = false;
};
watch(events, (value) => {
    localStorage.setItem(currentUser.value ? 'idolEvents' : 'idolGuestEvents', JSON.stringify(value));
    syncToCloud();
}, { deep: true });
watch(fandoms, (value) => {
    localStorage.setItem('fandomFandoms', JSON.stringify(value));
    syncToCloud();
}, { deep: true });
watch(customTitle, (value) => {
    localStorage.setItem('appTitle', value);
    syncToCloud();
});
watch(themeColor, (value) => {
    localStorage.setItem('idolTheme', value);
    syncToCloud();
});
watch(yearlyBudget, (value) => {
    localStorage.setItem('idolYearlyBudget', value);
    syncToCloud();
});
// 新增此段落：監聽地圖年份篩選
watch(selectedMapYear, () => {
    if (activeTab.value === 'map') {
        nextTick(() => { initMap(true); });
    }
});

watch(activeTab, (newTab) => {
    if (newTab === 'map') {
        nextTick(() => { initMap(); });
    }
});

                const adjustColor = (color, amount) => {
                    let hex = color.replace('#', '');
                    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
                    const num = parseInt(hex, 16);
                    let r = (num >> 16) + amount;
                    let g = ((num >> 8) & 0x00FF) + amount;
                    let b = (num & 0x0000FF) + amount;
                    r = Math.min(255, Math.max(0, r));
                    g = Math.min(255, Math.max(0, g));
                    b = Math.min(255, Math.max(0, b));
                    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                };
                
                const isColorLight = (color) => {
                    let hex = color.replace('#', '');
                    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
                    const r = parseInt(hex.substring(0, 2), 16);
                    const g = parseInt(hex.substring(2, 4), 16);
                    const b = parseInt(hex.substring(4, 6), 16);
                    const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
                    return hsp > 180;
                };

                const cssVars = computed(() => ({
                    '--primary-color': themeColor.value,
                    '--primary-dark': adjustColor(themeColor.value, -30),
                    '--primary-light': adjustColor(themeColor.value, 150)
                }));
                const getEventColor = (event) => (!event.color || event.color === '') ? themeColor.value : event.color;
                const isThemeColorLight = computed(() => isColorLight(themeColor.value));
                const headerTextColor = computed(() => isThemeColorLight.value ? 'text-slate-800' : 'text-white');
                const calculateFandomDays = (dateStr) => {
                    if (!dateStr || !validateDate(dateStr)) return 0;
                    const start = new Date(dateStr);
                    const today = new Date();
                    const diffTime = today.getTime() - start.getTime();
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    return diffDays > 0 ? diffDays : 0;
                };

                const calculateDaysToNextDate = (dateStr) => {
                    if (!dateStr || !validateDate(dateStr)) return 'N/A';
                    const dateParts = dateStr.split('-');
                    const month = Number(dateParts[1]);
                    const day = Number(dateParts[2]);
                    
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    let nextDate = new Date(today.getFullYear(), month - 1, day);
                    nextDate.setHours(0, 0, 0, 0);
                    
                    if (nextDate.getTime() < today.getTime()) {
                        nextDate.setFullYear(today.getFullYear() + 1);
                    }
                    
                    const diffTime = nextDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays === 0) return 0;
                    return diffDays;
                };

                const calculateYearsAndDaysSinceDebut = (dateStr) => {
                    if (!dateStr || !validateDate(dateStr)) return 'N/A';
                    const debut = new Date(dateStr);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    let years = today.getFullYear() - debut.getFullYear();
                    const hasPassed = (today.getMonth() > debut.getMonth() || (today.getMonth() === debut.getMonth() && today.getDate() >= debut.getDate()));
                    if (!hasPassed) {
                        years--;
                    }
                    
                    let lastAnniversary = new Date(today.getFullYear(), debut.getMonth(), debut.getDate());
                    if (lastAnniversary.getTime() > today.getTime()) {
                        lastAnniversary.setFullYear(today.getFullYear() - 1);
                    }
                    lastAnniversary.setHours(0, 0, 0, 0);
                    const diffDays = Math.floor((today.getTime() - lastAnniversary.getTime()) / (1000 * 60 * 60 * 24));

                    if (years < 0) return '尚未出道';
                    if (years === 0) return `第 ${diffDays} 天`;
                    
                    return `${years} 年又 ${diffDays} 天`;
                };
                const getBirthdayCongrats = (name) => {
                    const messages = [
                        `🎂 今天是 ${name} 的生日！願你比誰都幸福！✨`,
                        `🌟 Happy Birthday, ${name}！你是最閃亮的星！💖`,
                        `🎉 ${name} 生日快樂！謝謝你為平凡日子帶來那麼多光亮！☀️`,
                        `💖 今天的蛋糕與祝福都留給 ${name}！生日快樂！🎂`,
                        `🎁 專屬 ${name} 的日子！願你每天都充滿喜悅！🥳`,
                        `🎈 ${name} 的生日鐘聲響起！讓我們一起慶祝！🥂`,
                        `🍰 願 ${name} 的夢想都能實現，生日快樂！🚀`,
                        `✨ 為了 ${name} 準備的驚喜，生日快樂！🎁`,
                        `🎊 世界上最可愛的 ${name} 生日快樂！永遠支持你！💪`,
                        `🥂 為 ${name} 的新一歲乾杯！願未來有更多好消息！🎂`,
                        `💌 給 ${name} 的生日信，字字句句都是愛！生日快樂！🥰`,
                        `🎤 ${name} 的歌聲是最好的禮物，生日快樂！🎵`,
                        `👑 ${name} 生日快樂！願你一直自在地閃閃發光！💎`,
                        `🌈 願 ${name} 的每一天都如彩虹般絢爛！生日快樂！🎂`,
                        `🥳 今天是 ${name} 的節日！一起嗨翻全場！狂歡！🎈`,
                        `💐 ${name} 生日快樂！願你被鮮花和愛意包圍！🌸`,
                        `🍀 願幸運與 ${name} 同在，生日快樂！永遠健康！💪`,
                        `🌙 ${name} 是我們夜空中的月亮，生日快樂！✨`,
                        `💌 ${name} 生日快樂！請收下我們最真摯的祝福！🎁`,
                        `🎤 ${name} 的生日舞台，我們永遠在台下應援！🌟`,
                        `✨ 願 ${name} 永遠保持初心，閃耀如鑽石！生日快樂！💎`,
                        `💖 ${name} 的生日，我的心跳因你加速！🎂`,
                        `🌷 ${name} 生日快樂！新的一歲也要平安健康，做自己喜歡的事。`,
                        `📸 ${name} 的生日又到啦！今天就用喜歡的照片和回憶慶祝吧！`,
                        `🎵 願 ${name} 新的一歲有喜歡的音樂、舞台和滿滿的好心情！`,
                    ];
                    return messages[Math.floor(Math.random() * messages.length)];
                };

                const getDebutCongrats = (name) => {
                    const messages = [
                        `🎉 恭喜 ${name} 出道紀念日！感謝你選擇這條路！💖`,
                        `🎤 ${name} 出道日快樂！你值得所有掌聲與愛！🌟`,
                        `🏆 這是 ${name} 的里程碑！出道日快樂！未來繼續發光！✨`,
                        `🌟 遇見 ${name} 是最美的意外！出道日快樂！🥂`,
                        `🚀 ${name} 出道紀念日！夢想啟航，一路順風！🎈`,
                        `💖 ${name} 出道紀念日快樂！謝謝一路帶來的音樂與感動！💪`,
                        `✨ ${name} 永遠是舞台上的焦點，出道日快樂！🥳`,
                        `🍾️ 為 ${name} 的出道和無數的汗水致敬！出道快樂！🥂`,
                        `🌈 ${name} 出道紀念日快樂！我們的愛將與你並肩！🥰`,
                        `💎 ${name} 耀眼出道！願你的光芒永不熄滅！💎`,
                        `🎤 感謝 ${name} 的音樂與力量，出道日快樂！🎵`,
                        `🥳 這是屬於 ${name} 和粉絲的狂歡日！出道快樂！🎉`,
                        `💐 ${name} 出道紀念日！每一步都充滿意義！🌸`,
                        `💪 ${name} 繼續衝！我們永遠是你的後盾！出道快樂！💯`,
                        `💌 給 ${name} 最真誠的祝福，出道日快樂！🎁`,
                        `✨ ${name} 出道紀念日快樂！願往後每個舞台都閃閃發光！🎤`,
                        `💖 ${name} 出道日，我的心跳因你加速！🔥`,
                        `🎤 願 ${name} 的歌聲響徹每個角落，出道快樂！🌟`,
                        `👑 ${name} 帶著光環誕生，出道日快樂！永遠閃耀！✨`,
                        `🎊 ${name} 辛苦了！所有的努力都值得，出道快樂！🎉`,
                        `🥳 今天是 ${name} 夢想成真的日子，我們一起見證！🎈`,
                        `🌟 ${name} 出道日快樂！願你被愛與幸福包圍！💖`,
                        `🎬 又迎來 ${name} 的出道紀念日！一起回味最喜歡的舞台吧。`,
                        `🌷 ${name} 出道週年快樂！一路走來的每一步，都值得好好紀念。`,
                        `🎧 謝謝 ${name} 帶來那麼多好作品，期待下一次精彩的演出！`,
                    ];
                    return messages[Math.floor(Math.random() * messages.length)];
                };


                const fandomMessageStatic = (fandom) => {
                    const diffDays = calculateFandomDays(fandom.date);
                    const name = fandom.name;
                    const messages = [
                        `🎉 恭喜！這是你追隨 ${name} 的第 [DAYS] 天！`,
                        `${name} 陪你走過 [DAYS] 個閃耀的日子！🌟`,
                        `💖 追隨 ${name} 的腳步，堅持了 [DAYS] 天，你超棒！`,
                        `恭喜！你與 ${name} 的愛意已經累積到第 [DAYS] 個日子囉！🥰`,
                        `時間證明了愛意！你已經為 ${name} 應援 [DAYS] 天！💪`,
                        `無論晴雨，你對 ${name} 的熱愛已經持續 [DAYS] 天！☀️`,
                        `每個應援的瞬間都值得收藏！喜歡 ${name} 的第 [DAYS] 天也要閃閃發光！🌈`,
                        `對 ${name} 的喜歡已經持續 [DAYS] 天，熱情還是滿滿的！🔥`,
                        `數不清的星光，匯集成 [DAYS] 個愛 ${name} 的日子！✨`,
                        `因為喜歡 ${name}，平凡的日子也有了值得紀念的理由。第 [DAYS] 天快樂！💫`,
                        `第 [DAYS] 天，依然是那個讓你心動的 ${name}！❤️`,
                        `追星這場幸福的長跑，已經來到第 [DAYS] 天！繼續和 ${name} 一起向前吧！🏃‍♀️`,
                        `為了 ${name}，你已經變成了最棒的自己，持續了 [DAYS] 天！💯`,
                        `每一天都像初見一樣心動！與 ${name} 相伴的 [DAYS] 天！悸動！😍`,
                        `喜歡 ${name} 的 [DAYS] 天裡，一定收藏了不少快樂吧！🥳`,
                        `這就是追星的浪漫！回頭一看，喜歡 ${name} 已經 [DAYS] 天了！✨`,
                        `還記得當初入坑 ${name} 的那一刻嗎？不知不覺已經 [DAYS] 天了！🥹💖`,
                        `讓 ${name} 的音樂陪伴生活，不知不覺已經 [DAYS] 天了！🎧`,
                        `為 ${name} 應援的第 [DAYS] 天，謝謝一直保有熱情的自己！💪`,
                        `那些為 ${name} 心動的日子，累積成了 [DAYS] 天的珍貴回憶！💎`,
                        `這份浪漫持續了 [DAYS] 天，願你與 ${name} 永遠熱戀 🌹`, 
                        `因為遇見 ${name}，這 [DAYS] 天的生活都發著光 ✨`, 
                        `喜歡 ${name} 的第 [DAYS] 天，仍然有新的回憶值得期待！💎`,
                        `不知不覺已經入坑 [DAYS] 天！當初那個心動瞬間還記得嗎？🥹`,
                        `第 [DAYS] 天打卡成功！對 ${name} 的喜歡今天也準時報到。💌`,
                        `從一首歌、一個舞台開始，和 ${name} 的故事走到了第 [DAYS] 天。🎶`,
                        `原來喜歡 ${name} 已經 [DAYS] 天！日子過得快，回憶卻越來越多。📸`,
                        `追星進度更新：喜歡 ${name} 第 [DAYS] 天，心動仍在持續。💗`,
                        `有些日子因為 ${name} 而特別。今天是入坑第 [DAYS] 天！🌷`,
                        `謝謝當初決定入坑的自己，才能累積和 ${name} 有關的 [DAYS] 天回憶。✨`,
                        `第 [DAYS] 天，願喜歡 ${name} 這件事繼續帶來剛剛好的快樂。🌙`
                    ];
                    const randomIndex = Math.floor(Math.random() * messages.length);
                    const messageTemplate = messages[randomIndex];
                    return {
                        message: messageTemplate.replace(/\[DAYS\]/g, diffDays), 
                        days: diffDays
                    };
                };

                const fandomMessage = computed(() => { 
                    if (fandoms.value.length === 0 || fandoms.value.every(f => !f.date)) {
                        return "👋 點擊設定，開始你的入坑紀念日紀錄！";
                    }
                    
                    const activeFandoms = fandoms.value.filter(f => f.date);
                    if (activeFandoms.length === 0) return "👋 點擊設定，開始你的入坑紀念日紀錄！";

                    const currentFandom = activeFandoms[currentFandomIndex.value % activeFandoms.length];

                    const { message, days } = fandomMessageStatic(currentFandom);
                    
                    if (activeFandoms.length > 1) {
                        setTimeout(() => {
                            currentFandomIndex.value = (currentFandomIndex.value + 1) % activeFandoms.length;
                        }, 5000);
                    }
                    
                    return message;
                });
                
                const greetingMessage = computed(() => {
                    const hour = new Date().getHours();
                    const msgs = [
                        "無論多遠，心都在一起 💖", 
                        "存錢是為了更好的相遇 💰", 
                        "今天也要好好生活，期待下一次見面 ✨", 
                        "你的應援是他們的光 🌟",
                        "每一天都是通往幸福的倒數！🚀",
                        "為愛奔跑的你，最閃耀！💫",
                        "喜歡的心情繼續收藏，期待下一次見面 ❤️",
                        "追星的快樂很珍貴，也別忘了照顧自己！💯",
                        "今天也充滿元氣，為了見到最愛的人而努力💪",
                        "為了見到最愛的人，今天也要充滿元氣 💪",
                        "把想念化作動力，迎接下一個舞台 🎤",
                        "你是這場愛意長跑中最勇敢的選手 🏃‍♀️",
                        "所有的等待，都會在見面那一刻釋放 ✨",
                        "下一場還沒決定？先把想看的舞台記下來 🎫",
                        "喜歡的歌單一播放，追星能量又回來了 🎧",
                        "不用每場都到，喜歡的心意一樣珍貴 💗",
                        "回憶會慢慢累積，生活也要好好過 🌷",
                        "今天也為下一次相見保留一點期待 ✨"

                    ];
                    let baseMsg = hour < 12 ? "早安！" : hour < 18 ? "午安！" : "晚安！";
                    return baseMsg + msgs[Math.floor(Math.random() * msgs.length)];
                });
                const filteredEvents = computed(() => {
                    const today = new Date().toLocaleDateString('sv-SE');
                    let sorted = [...events.value].sort((a, b) => new Date(a.date) - new Date(b.date));
                    
                    if (searchQuery.value) {
                        const query = searchQuery.value.toLowerCase();
                        return sorted.filter(e => 
                            e.title.toLowerCase().includes(query) || 
                            e.artist.toLowerCase().includes(query) || 
                            e.location.toLowerCase().includes(query)
                        ).sort((a, b) => { 
                            const diffA = Math.abs(new Date(a.date) - new Date(today));
                            const diffB = Math.abs(new Date(b.date) - new Date(today));
                            return diffA - diffB;
                        });
                    }

                    return viewMode.value === 'upcoming' 
                        ? sorted.filter(e => e.date >= today) 
                        : sorted.filter(e => e.date < today).reverse();
                });

                const upcomingCount = computed(() => events.value.filter(e => e.date >= new Date().toLocaleDateString('sv-SE')).length);
                const currentYearExpense = computed(() => {
                    const y = new Date().getFullYear().toString();
                    return events.value.filter(e => e.date.startsWith(y)).reduce((sum, e) => sum + calculateTotal(e.expenses), 0);
                });
const availableYears = computed(() => {
    const currentYear = new Date().getFullYear().toString();
    const years = new Set(events.value.map(e => {
        const match = e.date.match(/^(\d{4})/);
        return match ? match[1] : null;
    }).filter(y => y !== null));

    years.add(currentYear); 
   return Array.from(years).sort((a, b) => b - a);
});

                const statsData = computed(() => {
                    let targetEvents = events.value;
      
                    if (selectedYear.value !== 'ALL') {
                        targetEvents = events.value.filter(e => e.date.match(new RegExp(`^${selectedYear.value}`)));
                    }
                    const count = targetEvents.length;
          
                    const totalSpent = targetEvents.reduce((acc, curr) => acc + calculateTotal(curr.expenses), 0);
                    
                    const artistMap = {};
                
                    targetEvents.forEach(e => {
                        const name = e.artist || '其他';
                        const color = getEventColor(e); 
                        if (!artistMap[name]) artistMap[name] = { count: 0, color: color };
    
                        artistMap[name].count++;
                    });
                    const sortedArtists = Object.keys(artistMap).map(key => ({ name: key, ...artistMap[key] })).sort((a, b) => b.count - a.count).slice(0, 3);
                    const maxArtistCount = sortedArtists.length > 0 ? sortedArtists[0].count : 1;
                    const locationMap = {};
                    targetEvents.forEach(e => {
                        const name = e.location || '未知地點';
                        if (!locationMap[name]) locationMap[name] = { count: 0 };
                        locationMap[name].count++;
                    });
                    const sortedLocations = Object.keys(locationMap).map(key => ({ name: key, ...locationMap[key] })).sort((a, b) => b.count - a.count).slice(0, 3);
                    const titleMap = {};
                    const excludeKeywords = ['사전녹화', '事前錄製', '簽售會', '簽名會', '錄製'];
                    targetEvents.forEach(e => {
                        const t = e.title.trim();
                        if (!excludeKeywords.some(k => t.includes(k))) titleMap[t] = (titleMap[t] || 0) + 1;
                    });
                    const series = Object.keys(titleMap).map(key => ({ title: key, count: titleMap[key] })).filter(item => item.count > 1).sort((a, b) => b.count - a.count);
                    return { 
                        count, 
                        totalSpent, 
                        topArtists: sortedArtists, 
                        maxArtistCount, 
                        series,
                        topLocations: sortedLocations, 
                    };
                });

// City labels also recognize known venues and saved map coordinates, not only city words in the venue name.
const recapVenueCity = (event) => {
  const place = String(event.location || '').toLowerCase().replace(/\s+/g,'');
  const venues = [
    ['首爾','kspodome','olympicgymnasticsarena','olympicpark','olympichall','jamsilstadium','jamsilindoorstadium','jamsilarena','gocheokskydome','gocheokdome','高尺天空巨蛋','蠶室','蚕室','잠실','고척','올림픽공원','올림픽체조경기장','체조경기장','ks포돔'],
    ['台北','台北大巨蛋','臺北大巨蛋','taipeidome','台北小巨蛋','臺北小巨蛋','taipeiarena'],
    ['高雄','高雄巨蛋','高雄流行音樂中心','高流','世運主場館','kaohsiungarena'],
    ['桃園','桃園巨蛋','桃園體育館'],
    ['台中','台中洲際','臺中洲際','台中巨蛋','臺中巨蛋'],
    ['新北','新莊體育館','新北市工商展覽中心']
  ];
  for (const [city,...names] of venues) if(names.some(name=>place.includes(name.toLowerCase()))) return city;
  return '';
};
const recapCities = computed(() => {
  const rows = events.value.filter(e => selectedYear.value === 'ALL' || String(e.date || '').startsWith(String(selectedYear.value)));
  const recognized = new Set();
  const names = [...Object.keys(recapCityAliases), ...Object.keys(recapCityCoordinates)].sort((a,b)=>b.length-a.length);
  for (const event of rows) {
    const location = String(event.location || '').trim();
    // First use explicit city names, including multilingual aliases and full addresses.
    const match = names.find(name => location.toLowerCase().includes(name.toLowerCase()));
    let city = match ? recapNormalizeCity(match) : '';
    if (!city) city = recapVenueCity(event);
    // Event map coordinates also identify cities when a venue name does not include one.
    if (!city && event.lat != null && event.lng != null && String(event.lat).trim() !== '' && String(event.lng).trim() !== '') {
      const lat = Number(event.lat), lng = Number(event.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && (lat !== 0 || lng !== 0)) {
        let nearest = '', nearestKm = Infinity;
        for (const [name, coords] of Object.entries(recapCityCoordinates)) {
          const km = calculateKm(lat,lng,coords[0],coords[1]);
          if (km < nearestKm) { nearest = name; nearestKm = km; }
        }
        // Limit approximation to nearby known cities; don't assign remote events to an unrelated city.
        if (nearestKm <= 55) city = nearest;
      }
    }
    if (city) recognized.add(city);
  }
  return [...recognized];
});
const recapHomeCity = ref(localStorage.getItem('idolRecapHomeCity') || '');
watch(recapHomeCity, city => localStorage.setItem('idolRecapHomeCity', city));
const recapCityCoordinates = window.IdolPlannerRecap.cityCoordinates;
const recapCityAliases = window.IdolPlannerRecap.cityAliases;
const recapKnownCities = Object.keys(recapCityCoordinates);
const recapNormalizeCity = input => { const value=String(input||'').trim(); if(!value) return ''; const alias=Object.keys(recapCityAliases).find(k=>k.toLowerCase()===value.toLowerCase()); const normalized=alias?recapCityAliases[alias]:value.replace(/臺/g,'台'); return Object.keys(recapCityCoordinates).find(k=>k.toLowerCase()===normalized.toLowerCase()) || ''; };
// Compare actual saved event coordinates first; the city list is only a fallback for older events.
const recapFarthestCity = computed(() => {
  const home = recapCityCoordinates[recapNormalizeCity(recapHomeCity.value)];
  if (!home) return null;
  const rows = events.value.filter(e => selectedYear.value === 'ALL' || String(e.date || '').startsWith(String(selectedYear.value)));
  const cityNames = [...Object.keys(recapCityAliases), ...Object.keys(recapCityCoordinates)].sort((a,b) => b.length-a.length);
  let best = null;
  for (const event of rows) {
    const raw = String(event.location || '');
    const matchedName = cityNames.find(name => raw.toLowerCase().includes(name.toLowerCase()));
    const namedCity = matchedName ? recapNormalizeCity(matchedName) : recapVenueCity(event);
    let coords = null, city = '';
    const latRaw = event.lat, lngRaw = event.lng;
    if (latRaw != null && lngRaw != null && String(latRaw).trim() !== '' && String(lngRaw).trim() !== '') {
      const lat = Number(latRaw), lng = Number(lngRaw);
      if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && (lat !== 0 || lng !== 0)) {
        coords = [lat,lng];
        // Only label a coordinate with a known city if it is geographically nearby.
        if (namedCity && recapCityCoordinates[namedCity] && calculateKm(lat,lng,...recapCityCoordinates[namedCity]) <= 80) city = namedCity;
        if (!city) {
          let nearest = '', nearestKm = Infinity;
          for (const [name, center] of Object.entries(recapCityCoordinates)) {
            const km = calculateKm(lat,lng,center[0],center[1]);
            if (km < nearestKm) { nearest = name; nearestKm = km; }
          }
          if (nearestKm <= 55) city = nearest;
        }
        if (!city) city = raw.trim() || '座標位置';
      }
    }
    if (!coords && namedCity && recapCityCoordinates[namedCity]) {
      coords = recapCityCoordinates[namedCity];
      city = namedCity;
    }
    if (!coords) continue;
    const km = Math.round(calculateKm(home[0],home[1],coords[0],coords[1]));
    if (!best || km > best.km) best = {city,km};
  }
  return best;
});
const recapTopVenue = computed(() => { const counts = new Map(); events.value.filter(e => selectedYear.value === 'ALL' || String(e.date || '').startsWith(String(selectedYear.value))).forEach(e => { const raw=String(e.location || '').trim(); if (!raw) return; const key=raw.replace(/臺/g,'台').replace(/\s+/g,' ').trim(); const entry=counts.get(key) || {name:key,count:0}; entry.count++; counts.set(key,entry); }); return [...counts.values()].sort((a,b)=>b.count-a.count || a.name.localeCompare(b.name,'zh-Hant'))[0] || null; });
const recapMonths = computed(() => { const months = Array(12).fill(0); events.value.filter(e => selectedYear.value === 'ALL' || String(e.date || '').startsWith(String(selectedYear.value))).forEach(e => { const m = Number(String(e.date || '').slice(5,7)); if(m>=1 && m<=12) months[m-1]++; }); return months; });
const recapMonthMax = computed(() => Math.max(1,...recapMonths.value));
const recapPalette = computed(() => { const year=String(selectedYear.value); return year==='2024' ? {background:'#FFBE98',ink:'#563A3C'} : year==='2025' ? {background:'#A47864',ink:'#FFF8F0'} : year==='2026' ? {background:'#F5F3F0',ink:'#383437'} : year==='2023' ? {background:'#BB2649',ink:'#FFFFFF'} : year==='2022' ? {background:'#6667AB',ink:'#FFFFFF'} : year==='2021' ? {background:'#939597',ink:'#242424'} : year==='2020' ? {background:'#0F4C81',ink:'#FFFFFF'} : year==='2019' ? {background:'#FF6F61',ink:'#342C2D'} : year==='2018' ? {background:'#5F4B8B',ink:'#FFFFFF'} : year==='2017' ? {background:'#88B04B',ink:'#342C2D'} : year==='2016' ? {background:'#F7CAC9',ink:'#342C2D'} : year==='2015' ? {background:'#955251',ink:'#FFFFFF'} : year==='2014' ? {background:'#B163A3',ink:'#FFFFFF'} : year==='2013' ? {background:'#009B77',ink:'#FFFFFF'} : year==='2012' ? {background:'#DD4124',ink:'#FFFFFF'} : year==='2011' ? {background:'#D65076',ink:'#FFFFFF'} : year==='2010' ? {background:'#45B8AC',ink:'#342C2D'} : year==='2009' ? {background:'#F0C05A',ink:'#342C2D'} : year==='2008' ? {background:'#5A5B9F',ink:'#FFFFFF'} : year==='2007' ? {background:'#9B1B30',ink:'#FFFFFF'} : year==='2006' ? {background:'#DECDBE',ink:'#342C2D'} : year==='2005' ? {background:'#53B0AE',ink:'#342C2D'} : year==='2004' ? {background:'#E2583E',ink:'#FFFFFF'} : year==='2003' ? {background:'#7BC4C4',ink:'#342C2D'} : year==='2002' ? {background:'#BF1932',ink:'#FFFFFF'} : year==='2001' ? {background:'#C74375',ink:'#FFFFFF'} : year==='2000' ? {background:'#98B2D1',ink:'#342C2D'} : {background:'#F1E8E7',ink:'#40323A'}; });

const emotionalSummary = computed(() => {
    const { count, totalSpent, topArtists } = statsData.value;
    if (count === 0) return "準備好開啟新的追星旅程了嗎？🌟";

    let mainArtist = topArtists.length > 0 ? topArtists[0].name : "他們"; 
    let category = 'balanced';

    if (count >= 15 || totalSpent >= 100000) category = 'legend';     
    else if (count >= 8 || totalSpent >= 50000) category = 'active';  
    else if (count >= 3) category = 'balanced'; 
    else category = 'beginner'; 

    const pools = {
        legend: [
            `哇！這一年你為了見 ${mainArtist} 真的拚盡全力，熱情值已超越大氣層！🚀`,
            `你的足跡踏遍了各個場館，是名符其實的追星模範生！🏆 你的愛意無可取代。`,
            `體力好、熱情足，這一年你過得比誰都充實，充滿了心動與閃耀瞬間。 ✨`,
            `這一年見到 ${mainArtist} 的次數多到讓人羨慕！每次現場都是新的心動。😂`,
            `這就是「用愛發電」吧！⚡️ 為 ${mainArtist} 奔赴現場的每一次都值得收藏。`,
            `回顧這一年，滿滿的票根就是你愛的證明！❤️ 感謝你無悔的付出與追隨。`,
            `這一年行程滿檔，追星熱情也滿格！記得在精彩之餘好好休息。💎`,
            `這一年你不是在看演唱會，就是在看演唱會的路上，你是真正的舞台獵人！🎤`,
            `為了喜歡的人跨越城市與距離，每段旅程都留下了閃閃發光的足跡。🌍`,
            `對 ${mainArtist} 的喜歡，成了這一年最耀眼的篇章之一。✨`
        ],
        active: [
            `錢錢變成了門票與回憶！💸 快樂值得珍惜，預算也要好好顧。`,
            `投資在快樂上是世界上最划算的交易！📈 你的幸福感已經隨時要爆表啦！`,
            `雖然錢包瘦了，但心靈超級富足！🥰 每一分錢都買到了與 ${mainArtist} 無價的回憶。`,
            `努力工作就是為了這一刻，你值得擁有這些美好！💪 你是粉絲中的驕傲！`,
            `所謂的財富自由，就是能隨心所欲地去見想見的人！💰 你的行動力讓人驚嘆！`,
            `這些是為 ${mainArtist} 留下的快樂紀錄，回味之餘也別忘了照顧荷包。🍚`,
            `這一年你與 ${mainArtist} 的頻率共振次數驚人，簡直是心有靈犀的最佳範本。💘`,
            `每一次奔赴現場的你，都帶著最燦爛的笑容，那是追星最美的模樣。🌟`,
            `你的應援聲早已刻在場館的空氣中，謝謝你成為 ${mainArtist} 舞台下的底氣。🔥`,
            `這份熱愛讓你的生活變得五彩繽紛，你成功將夢想照進了現實生活。🌈`
        ],
        balanced: [
            `重質不重量，每一次與 ${mainArtist} 的見面都是奇蹟 ✨ 珍貴的回憶已完美封存。`,
            `剛剛好的距離，剛剛好的愛，這一年很完美！🌸 你是愛情長跑的優秀典範。`,
            `生活與追星的完美平衡，你是時間管理大師！⏰ 成功找到了屬於你的應援節奏。`,
            `細水長流的愛，才是最長情的告白 💌 你的心意細膩、溫柔且無比堅定。`,
            `每一次見面，都為這一年增添了閃亮的色彩 🎨 創造了專屬你的浪漫篇章。`,
            `謝謝 ${mainArtist}，成為你平凡日子裡的一束光 💡 帶來了無窮的治癒能量。`,
            `在這忙碌的世界，你為自己保留了一方純粹的愛意之地，真的很不容易。🍀`,
            `那場演唱會的燈海，也有你的一份光亮，這份參與感將陪伴你很久很久。🌌`,
            `即使見面頻率適中，但每次重逢時的心跳聲，依然跟初見一樣強烈。💓`,
            `你學會了在等待中沉澱，在相遇時爆發，這份愛變得越來越有深度。📖`
        ],
        beginner: [
            `好的開始是成功的一半，期待明年與 ${mainArtist} 有更多的相遇！🌱`,
            `那一天的回憶，足夠溫暖整個寒冬 ❄️ 將感動化為力量繼續前進。`,
            `雖然見面次數不多，但愛意絲毫不減！💖 堅定的愛最讓人動容。`,
            `把那一次的感動好好收藏，那是你的獨家記憶 🗝️ 屬於你與他的秘密。`,
            `小小的幸福，累積成大大的快樂！🥰 感謝你每一次珍貴的到來。`,
            `第一張門票是愛情的入場券，恭喜你開啟了這段奇幻的追星冒險！🎫`,
            `即使只去了幾場，現場的燈光與歡呼也足以回味很久。✨`,
            `你正在累積能量，為了下一次更華麗的重逢而準備著，加油！🚀`,
            `追星的路上不分快慢，只要心跳還在跳動，每一刻都是最好的安排。💓`,
            `那天在人群裡望向舞台的心情，或許正是你下一次出發的理由。🎤`
        ]
    };

    // 使用 Math.random() 達成完全隨機
    const selectedPool = pools[category];
    return selectedPool[Math.floor(Math.random() * selectedPool.length)];
});


const idolNagging = computed(() => {
    const { totalSpent, topArtists } = statsData.value;
    const name = topArtists.length > 0 ? topArtists[0].name : '偶像';
    
    const pools = {
        zero: [
            `最近還沒有新紀錄呢！下一次與 ${name} 的回憶會是什麼？🥺`,
            `在忙嗎？好久沒看到你記錄跟 ${name} 的回憶了 📝`,
            `空空的儀表板在等著你填滿與 ${name} 的點滴喔 ✨`,
            `儲存回憶不嫌多，快來記下你對 ${name} 的心動瞬間吧！`,
            `是不是忘了更新？${name} 的愛意還在等待被記錄呢 💖`
        ],
        low: [ // 1 ~ 1000
            `有乖乖吃飯嗎？${name} 不希望你餓肚子喔 🍱`,
            `支持不用比多寡，能讓自己開心就很棒了！🍀`,
            `細水長流的愛最動人，謝謝你陪伴 ${name}。`,
            `這點投資買到了無價的快樂，超划算！📈`,
            `喜歡 ${name} 的方式有很多種，照自己的步調就好。💗`
        ],
        mid: [ // 1001 ~ 10000
            `生活和追星都照顧得到，這份節奏很不錯！💪`,
            `謝謝你的支持！每一分錢都變成了與 ${name} 的美好回憶。`,
            `一想到下次能見到 ${name}，心情是不是就亮起來了？✨`,
            `花出去的是費用，留下的是與 ${name} 有關的珍貴回憶。`,
            `為了見面努力安排生活的你，也值得好好被自己肯定！✨`
        ],
        tier30k: [ // ~ 30000
            `哇... 你的錢包還好嗎？${name} 有點擔心你吃土耶 😰`,
            `熱情滿分！但也記得留點預算給自己的生活喔。🛍️`,
            `感覺你這一年過得很充實呢，充滿了 ${name} 的色彩！`,
            `這筆支出叫做「精神糧食費」，對 ${name} 的愛是無上限的！`,
            `每一次見面都是奇蹟，謝謝你跨越距離來到 ${name} 身邊。`
        ],
        tier50k: [ // ~ 50000
            `天啊！你對 ${name} 的愛已經快溢出來了！😭❤️`,
            `理性消費喔！${name} 希望我們能長長久久地見面 🤝`,
            `你就是 ${name} 的最強後援！這份熱情誰也比不上 🔥`,
            `存錢是為了更好的相遇，你做到了！💰`,
            `為 ${name} 留下了好多回憶，也記得把照顧自己排進行程！`
        ],
        tier100k: [ // ~ 100000
            `這數字... 感覺你可以直接去應徵 ${name} 的經紀人了 😂`,
            `錢錢沒有不見，只是變成了 ${name} 閃耀的舞台！`,
            `你對 ${name} 的投資已經達到大師等級，太強了 🏆`,
            `這就是用愛發電嗎？${name} 接收到滿滿的能量了！⚡️`,
            `你的支持是 ${name} 前進的動力，但記得對自己好一點喔。`
        ],
        tier300k: [ // ~ 300000
            `你對 ${name} 的愛已經超越大氣層了！🚀`,
            `這是要把整座舞台買下來送給 ${name} 嗎？💎`,
            `這份熱情真的很驚人！每一場都記得留下屬於自己的故事。🥰`,
            `這數字簡直是藝術！感謝你為 ${name} 創造的每個奇蹟。`,
            `你是 ${name} 宇宙中的超級星探，眼光真的太好了！`
        ],
        tier500k: [ // ~ 500000
            `你是不是把 ${name} 的周邊都包圓了？財力驚人！💸`,
            `追星預算來到驚人等級！希望每次出發都讓你覺得值得。🙇‍♂️`,
            `這份熱愛足以寫進你的追星年鑑，記得收藏每個珍貴瞬間。`,
            `為了見 ${name} 走過的里程，大概可以繞地球三圈了 🌍`,
            `你對 ${name} 的支持已經是信仰等級了，向你致敬！`
        ],
        tier900k: [ // ~ 900000
            `你是 ${name} 公司的隱形股東吧！請受我一拜 🙇‍♂️`,
            `這數字已經是傳說等級了！記得量力而為，也要照顧自己。👑`,
            `如果能召喚下一場演唱會就好了！（開玩笑的）🧙‍♂️`,
            `你的應援已經變成了一種傳奇，大家都認識你了！`,
            `喜歡 ${name} 的每一步都值得被記錄，也別忘了好好過生活。`
        ],
        legend: [ // 1000000+
            `百萬級應援！你就是 ${name} 的守護神 👼`,
            `這數字已經無法用言語形容了... 這是絕對的真愛！❤️`,
            `恭喜達成「追星天花板」成就！${name} 為你鼓掌 👏`,
            `你是 ${name} 生命中最燦爛的極光，照亮了所有黑暗 🌌`,
            `傳說中的全勤加神級贊助，你就是追星界的王者！🤴`
        ]
    };

    let selectedPool;
    if (totalSpent === 0) selectedPool = pools.zero;
    else if (totalSpent <= 1000) selectedPool = pools.low;
    else if (totalSpent <= 10000) selectedPool = pools.mid;
    else if (totalSpent <= 30000) selectedPool = pools.tier30k;
    else if (totalSpent <= 50000) selectedPool = pools.tier50k;
    else if (totalSpent <= 100000) selectedPool = pools.tier100k;
    else if (totalSpent <= 300000) selectedPool = pools.tier300k;
    else if (totalSpent <= 500000) selectedPool = pools.tier500k;
    else if (totalSpent <= 900000) selectedPool = pools.tier900k;
    else selectedPool = pools.legend;

    return selectedPool[Math.floor(Math.random() * selectedPool.length)];
});

                const mappedEventsCount = computed(() => events.value.filter(e => e.lat && e.lng).length);
                const missingCoordsCount = computed(() => events.value.length - mappedEventsCount.value);
                const { calculateTotal, getTicketPrice } = window.IdolPlannerEvents;
                const addExpenseItem = (n) => form.value.expenses.push({ item: n, amount: '' });
                const removeExpenseItem = (i) => form.value.expenses.splice(i, 1);
                const addChecklistItem = () => form.value.checklist.push({ text: '', checked: false });
                const removeChecklistItem = (i) => form.value.checklist.splice(i, 1);
                const addDefaultChecklist = () => ['門票/證件', '手燈+電池', '行動電源', '望遠鏡', '水/喉糖'].forEach(t => form.value.checklist.push({ text: t, checked: false }));
                const toggleExpand = (id) => expandedEventId.value = (expandedEventId.value === id) ? null : id;
                const setTheme = (c) => {
                    themeColor.value = c;
                    localStorage.setItem('idolTheme', c);
                }
                const updateCustomTheme = (e) => setTheme(e.target.value);
                const openModal = () => {
                    isEditing.value = false;
                    form.value = { ...defaultForm, date: new Date().toLocaleDateString('sv-SE'), color: themeColor.value, expenses: [{item:'門票', amount:''}], checklist:[], memo:'', useUrl: false };
                    searchError.value = '';
                    showModal.value = true;
                };

                const editEvent = (evt) => {
                    isEditing.value = true;
                    form.value = { 
                        ...defaultForm, 
                        ...JSON.parse(JSON.stringify(evt)),
                        expenses: evt.expenses || [],
                        checklist: evt.checklist || [],
                        coverUrl: evt.coverUrl || '',
                        sticker: evt.sticker || ''
                    };
                    form.value.useUrl = (evt.coverUrl && !evt.coverUrl.startsWith('data:')) || false;
                    searchError.value = '';
                    showModal.value = true;
                };

                const closeModal = () => showModal.value = false;
                const saveEvent = () => {
                    if (!form.value.title || !form.value.date) return alert('請填寫活動名稱與日期 🥺');
                    form.value.expenses = form.value.expenses.filter(e => e.item && e.item.trim() !== '');
                    form.value.checklist = form.value.checklist.filter(c => c.text && c.text.trim() !== '');
                    if (form.value.color === themeColor.value) form.value.color = '';

                    const eventToSave = JSON.parse(JSON.stringify(form.value));
                    delete eventToSave.useUrl;

                    if (isEditing.value) {
                        const idx = events.value.findIndex(e => e.id === form.value.id);
                        if (idx !== -1) events.value[idx] = eventToSave;
                    } else {
                        events.value.push({ ...eventToSave, id: Date.now().toString() });
                    }
                    closeModal();
                };

                const deleteEvent = (id) => {
                    if (confirm('確定要刪除此行程嗎？此操作無法恢復。')) {
                        events.value = events.value.filter(e => e.id !== id);
                        if(expandedEventId.value === id) expandedEventId.value = null;
                    }
                };
                const toggleSettingsModal = () => showSettingsModal.value = !showSettingsModal.value;
                
                const updateAppTitle = () => {
                    if (customTitle.value.trim() === '') {
                        customTitle.value = '追星日記 ✨';
                    }
                    localStorage.setItem('appTitle', customTitle.value);
                }
                
                const showChangelog = () => {
                    showSettingsModal.value = false;
                    showChangelogModal.value = true;
                };

                const searchCoordinates = async () => {
    if (!form.value.location) {
        searchError.value = "請先輸入地點名稱";
        return;
    }
    isSearching.value = true;
    searchError.value = '定位中...';

    // 優化：加上時間戳記避免讀取到失敗的快取，並加入隨機身份識別
    const apiUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.value.location)}&limit=1&t=${Date.now()}`;
    
    try {
        const response = await fetch(apiUrl, {
            headers: {
               // 隨機化 User-Agent 讓伺服器認為是不同請求
               'User-Agent': `IdolDiary/${Math.random().toString(36).substring(7)}`,
               'Accept-Language': 'zh-TW,zh;q=0.9'
            }
        });

        if (response.status === 429) throw new Error("請求太頻繁，請等幾秒再試一次");
        if (!response.ok) throw new Error(`連線失敗: ${response.status}`);

                        const data = await response.json();
                        if (data && data.length > 0) {
                            form.value.lat = parseFloat(data[0].lat);
                            form.value.lng = parseFloat(data[0].lon);
                            
                            const latFormatted = form.value.lat.toFixed(4);
                            const lngFormatted = form.value.lng.toFixed(4);
                            searchError.value = `定位成功！經緯度: Lat ${latFormatted}, Lng ${lngFormatted}`;
                        } else {
                            form.value.lat = null;
                            form.value.lng = null;
                            searchError.value = "找不到該地點的坐標，請嘗試更具體的名稱 (如:KSPO DOME改成올림픽체조경기장)";
                        }
                    } catch (e) {
                        console.error("地圖定位錯誤:", e);
                        searchError.value = `連線錯誤或請求被拒絕: ${e.message}。請稍後再試。`;
                    } finally {
                        isSearching.value = false;
                        if (activeTab.value === 'map') {
                            nextTick(() => { initMap(); });
                        }
                    }
                };
                // 修正後的 initMap 邏輯

const initMap = (preserveView = false) => {
    if (!map) {
        map = L.map('map-container').setView([23.6978, 120.9605], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    } else {
        map.invalidateSize();
    }

    // 關鍵：先清空舊的點與線
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    // 根據選定年度過濾
    const baseEvents = selectedMapYear.value === 'ALL' 
        ? events.value 
        : events.value.filter(e => e.date && e.date.startsWith(selectedMapYear.value));

    const sortedEvents = [...baseEvents]
        .filter(e => e.lat && e.lng)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (sortedEvents.length === 0) return;

    // 重新畫點與畫線邏輯
    const pathCoords = sortedEvents.map(e => [e.lat, e.lng]);
    const groupPoints = {};
    sortedEvents.forEach(e => {
        const key = `${Number(e.lat).toFixed(4)}_${Number(e.lng).toFixed(4)}`;
        if (!groupPoints[key]) groupPoints[key] = [];
        groupPoints[key].push(e);
    });

    // 將使用者輸入視為純文字，避免活動名稱破壞 Leaflet 彈窗結構。
    const escapePopupText = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    Object.values(groupPoints).forEach(eventsAtLoc => {
        const latest = eventsAtLoc[eventsAtLoc.length - 1];
        const color = getEventColor(latest);
        const marker = L.circleMarker([latest.lat, latest.lng], { radius: 7, fillColor: color, color: '#fff', weight: 2, fillOpacity: 0.8 }).addTo(map);
        let popup = `<div style="min-width:210px;max-width:280px;"><div style="max-height:min(45dvh,380px);overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;">`;
        [...eventsAtLoc].reverse().forEach(ev => {
            popup += `<div style="border-bottom:1px dashed #eee; margin-bottom:5px; padding-bottom:5px;">
                <b style="color:${getEventColor(ev)}">${escapePopupText(ev.artist)}</b><br>
                <small>${escapePopupText(ev.title)}</small><br>
                <small style="color:#666">📅 ${escapePopupText(ev.date)}</small>
            </div>`;
        });
        popup += `</div></div>`;
        marker.bindPopup(popup, { maxWidth: 320, autoPan: true, keepInView: true, className: "event-map-popup" });
        marker.on('popupopen', (evt) => { const scroller = evt.popup.getElement()?.querySelector('[style*="overflow-y:auto"]'); if (scroller) { scroller.scrollTop = 0; L.DomEvent.disableScrollPropagation(scroller); L.DomEvent.disableClickPropagation(scroller); requestAnimationFrame(() => { scroller.scrollTop = 0; }); } });
        markers.push(marker);
    });

    if (pathCoords.length > 1) {
        const polyline = L.polyline(pathCoords, { color: themeColor.value, weight: 3, opacity: 0.6, dashArray: '10, 15' }).addTo(map);
        markers.push(polyline);
    }
    if (!preserveView && pathCoords.length > 0) map.fitBounds(pathCoords, { padding: [50, 50] });
};




                // Calendar
                const showCalendarOptions = (event) => {
                    calendarEvent.value = event;
                    showCalendarModal.value = true;
                };

                const addToiCal = () => {
                    showCalendarModal.value = false;
                    const event = calendarEvent.value;
                    if (!event) return;
                    
                    const { title, date, time, location, artist } = event;
                    const startDateTime = new Date(`${date}T${time}`).toISOString().replace(/-|:|\.\d+/g, "");
                    const endDateTime = new Date(new Date(`${date}T${time}`).getTime() + 3*60*60*1000).toISOString().replace(/-|:|\.\d+/g, "");
                    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${title} - ${artist}\nDTSTART:${startDateTime}\nDTEND:${endDateTime}\nLOCATION:${location}\nDESCRIPTION:追星日記行程\nEND:VEVENT\nEND:VCALENDAR`;
                    
                    const blob = new Blob([icsContent], { type: 'text/calendar' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `${title}.ics`;
                    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                };
                const addToGoogleCalendar = () => {
                    showCalendarModal.value = false;
                    const event = calendarEvent.value;
                    if (!event) return;

                    const { title, date, time, location, artist } = event;
                    const start = date.replace(/-/g, '') + 'T' + time.replace(/:/g, '') + '00';
                    const endDateObj = new Date(new Date(`${date}T${time}`).getTime() + 3*60*60*1000);
                    const endHours = String(endDateObj.getHours()).padStart(2, '0');
                    const endMinutes = String(endDateObj.getMinutes()).padStart(2, '0');
                    const endSeconds = String(endDateObj.getSeconds()).padStart(2, '0');
                    const end = endDateObj.toLocaleDateString('sv-SE').replace(/-/g, '') + 'T' + endHours + endMinutes + endSeconds;
                    const gCalLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title + ' - ' + artist)}&dates=${start}/${end}&details=${encodeURIComponent('追星日記行程: ' + title)}&location=${encodeURIComponent(location)}&sf=true&output=xml`;
                    
                    window.open(gCalLink, '_blank');
                };
                // Ticket Logic
                const showTicket = (evt) => {
                    ticketEvent.value = evt;
                    showTicketModal.value = true;
                }

                const downloadBackup = () => {
                    // 外部完整備份，不接觸資料庫寫入。
                    try {
                        const snapshot = {
                            backupFormat: 'idol-tracker-full',
                            backupVersion: 1,
                            exportedAt: new Date().toISOString(),
                            data: {
                                events: JSON.parse(JSON.stringify(events.value)),
                                fandoms: JSON.parse(JSON.stringify(fandoms.value)),
                                customTitle: customTitle.value,
                                themeColor: themeColor.value,
                                yearlyBudget: yearlyBudget.value
                            }
                        };
                        const json = JSON.stringify(snapshot, null, 2);
                        const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
                        const objectUrl = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = objectUrl;
                        link.download = 'idol_tracker_full_backup_' +
                            new Date().toLocaleDateString('sv-SE') + '_' +
                            new Date().toTimeString().slice(0, 8).replace(/:/g, '-') + '.json';
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
                    } catch (error) {
                        console.error('完整備份匯出失敗:', error);
                        alert('備份匯出失敗，請勿清除瀏覽器資料。');
                    }
                };
                const restoreBackup = (event) => {
                    const file = event.target.files && event.target.files[0];
                    if (!file) return;
                    // 還原前必須先驗證格式；絕不把不認識的 JSON 當成空資料。
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const parsed = JSON.parse(e.target.result);
                            const isLegacy = Array.isArray(parsed);
                            const isFull = parsed &&
                                parsed.backupFormat === 'idol-tracker-full' &&
                                parsed.backupVersion === 1 &&
                                parsed.data && Array.isArray(parsed.data.events) &&
                                Array.isArray(parsed.data.fandoms);
                            if (!isLegacy && !isFull) {
                                alert('不支援的備份格式，沒有變更任何資料。');
                                return;
                            }
                            const restoreData = isLegacy ? { events: parsed } : parsed.data;
                            if (!restoreData.events.every(item => item && typeof item === 'object')) {
                                alert('行程資料格式異常，已取消還原。');
                                return;
                            }
                            const summary = '這份備份包含 ' + restoreData.events.length +
                                ' 筆行程' + (isFull ? '、' + restoreData.fandoms.length +
                                ' 筆紀念日與個人設定' : '（舊版格式，僅還原行程）') +
                                '。\n還原後會取代目前對應的資料並同步到雲端。\n確定繼續嗎？';
                            if (!confirm(summary)) return;
                            // 將還原前狀態先留在本機，方便意外時找回。
                            localStorage.setItem('idolPreRestoreBackup', JSON.stringify({
                                events: events.value,
                                fandoms: fandoms.value,
                                customTitle: customTitle.value,
                                themeColor: themeColor.value,
                                yearlyBudget: yearlyBudget.value,
                                savedAt: new Date().toISOString()
                            }));
                            events.value = restoreData.events;
                            if (isFull) {
                                fandoms.value = restoreData.fandoms;
                                if (typeof restoreData.customTitle === 'string') customTitle.value = restoreData.customTitle;
                                if (typeof restoreData.themeColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(restoreData.themeColor)) {
                                    themeColor.value = restoreData.themeColor;
                                }
                                if (Number.isFinite(Number(restoreData.yearlyBudget)) && Number(restoreData.yearlyBudget) > 0) {
                                    yearlyBudget.value = Number(restoreData.yearlyBudget);
                                }
                            }
                            showSettingsModal.value = false;
                            alert('備份已載入。若已登入且同步正常，系統會自動儲存至雲端。');
                        } catch (error) {
                            console.error('備份還原失敗:', error);
                            alert('備份讀取失敗，原有資料未變更。');
                        } finally {
                            event.target.value = '';
                        }
                    };
                    reader.onerror = () => alert('檔案讀取失敗，沒有變更資料。');
                    reader.readAsText(file);
                };

                const processImport = () => {
                    try {
                        const data = JSON.parse(importJson.value);
                        if (Array.isArray(data)) {
                            const newEvts = data.map(d => {
                                let title = d.title || d['活動名稱'] || '未命名活動';
                                let artist = d.artist || d['歌手'] || '';
                      
                                let location = d.location || d['地點'] || '';
               
                                let time = d.time || d['時間'] || '00:00';
                             
                                let color = d.color || d['應援色'] || ''; 
                                let seat = d.seat || d['座位'] || '';
              
                                let memo = d.memo || d['心得'] || '';
                                let rawDate = d.date || d['日期'] || '';
                   
                 
                                let formattedDate = new Date().toLocaleDateString('sv-SE');
                                if (rawDate) {
                                    const str = String(rawDate).trim();
                                    if (/^\d{6}$/.test(str)) formattedDate = `20${str.substring(0, 2)}-${str.substring(2, 4)}-${str.substring(4, 6)}`;
                                    else if (/^\d{8}$/.test(str)) formattedDate = `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`;
                                    else if (str.includes('-') || str.includes('/')) formattedDate = str.replace(/\//g, '-');
                                }
                                
                                let expenses = [];
                                if (d.expenses && Array.isArray(d.expenses)) {
                   
                                    expenses = d.expenses.map(exp => ({
                                        item: exp.item || exp['項目'] || '未分類',
                           
                                        amount: Number(exp.amount) || Number(exp['金額']) || 0
                                    
                                    })).filter(exp => exp.amount > 0);
                                } else {
                                    let price = d.price || d['票價'] || d['金額'] || 0;
                                    if (price > 0) expenses.push({ item: '門票', amount: price });
                                }
                                
                                return { id: Date.now()+Math.random(), title, artist, date: formattedDate, time, location, color, expenses, seat, memo, checklist: [], lat: null, lng: null, coverUrl: '', sticker: '' };
                            });
                            events.value = [...events.value, ...newEvts];
                            showImportModal.value = false;
                            alert(`成功匯入 ${newEvts.length} 筆！`);
                        } else { alert('格式錯誤');
                        }
                    } catch(e) { alert('JSON 格式錯誤');
                    }
                };
                
                const importMode = ref('table');
                const readImportFile = async event => {
                    const file = event.target.files && event.target.files[0];
                    if (!file) return;
                    if (file.size > 1024 * 1024) { alert('檔案請小於 1MB'); return; }
                    try {
                        importJson.value = await file.text();
                        importMode.value = file.name.toLowerCase().endsWith('.json') ? 'json' : 'file';
                    } catch(e) { alert('無法讀取檔案'); }
                };
                const parseImportTable = source => {
                    const lines = source.trim().split(/\r?\n/).filter(x => x.trim());
                    const delimiter = lines[0].includes('\t') ? '\t' : ',';
                    const splitLine = line => {
                        const cells = []; let cell = '', quoted = false;
                        for (let i = 0; i < line.length; i++) {
                            const ch = line[i];
                            if (ch === '"') {
                                if (quoted && line[i+1] === '"') { cell += '"'; i++; }
                                else quoted = !quoted;
                            } else if (ch === delimiter && !quoted) { cells.push(cell.trim()); cell = ''; }
                            else cell += ch;
                        }
                        cells.push(cell.trim()); return cells;
                    };
                    const headers = splitLine(lines.shift()).map(x => x.replace(/^\uFEFF/, '').trim());
                    if (!headers.some(x => ['日期','date'].includes(x.toLowerCase())) ||
                        !headers.some(x => ['活動名稱','title'].includes(x.toLowerCase()))) {
                        throw new Error('表格第一列需要「日期」和「活動名稱」欄位');
                    }
                    return lines.map(line => {
                        const values = splitLine(line); const row = {};
                        headers.forEach((h,i) => { row[h] = values[i] || ''; }); return row;
                    });
                };
                const processImportSafe = () => {
                    if (currentUser.value && !cloudReady.value) {
                        alert('雲端資料尚未載入完成，請稍後再匯入。');
                        return;
                    }
                    try {
                        let source = importJson.value.trim();
                        if (!source) { alert(importMode.value === 'json' ? '請先貼上 JSON 行程資料。' : '請先貼上含標題列的表格資料。'); return; }
                        if (source.startsWith('```')) {
                            source = source.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
                        }
                        const parsed = (importMode.value === 'json' || source.startsWith('[') || source.startsWith('{')) ? JSON.parse(source) : parseImportTable(source);
                        if (parsed && parsed.backupFormat === 'idol-tracker-full') {
                            alert('這是完整備份檔。請使用「設定 → 還原資料」選取檔案；儀表板的匯入只新增行程。');
                            return;
                        }
                        const data = Array.isArray(parsed) ? parsed :
                            (parsed && Array.isArray(parsed.events) ? parsed.events : null);
                        if (!data) { alert('請貼上 JSON 行程陣列，或含 events 陣列的物件。'); return; }
                        if (!data.length) { alert('沒有可匯入的行程；原資料不變。'); return; }
                        if (!data.every(d => d && typeof d === 'object' && !Array.isArray(d))) {
                            alert('JSON 行程項目必須是物件。'); return;
                        }
                        const formatDate = raw => {
                            const s = String(raw || '').trim();
                            let value = s;
                            if (/^\d{6}$/.test(s)) value = '20' + s.slice(0,2) + '-' + s.slice(2,4) + '-' + s.slice(4,6);
                            else if (/^\d{8}$/.test(s)) value = s.slice(0,4) + '-' + s.slice(4,6) + '-' + s.slice(6,8);
                            else value = s.replace(/\//g, '-');
                            if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
                            const d = new Date(value + 'T12:00:00');
                            return !Number.isNaN(d.getTime()) && d.toLocaleDateString('sv-SE') === value ? value : null;
                        };
                        const invalid = data.findIndex(d =>
                            !formatDate(d.date ?? d['日期']) ||
                            !String(d.title ?? d['活動名稱'] ?? '').trim() ||
                            !String(d.artist ?? d['歌手'] ?? '').trim());
                        if (invalid !== -1) {
                            alert('第 ' + (invalid + 1) + ' 筆行程的日期或活動名稱不正確，已取消整批匯入。');
                            return;
                        }
                        const incoming = data.map(d => {
                            const expenses = Array.isArray(d.expenses)
                                ? d.expenses.map(e => ({item:e.item || e['項目'] || '未分類',
                                    amount:Number(e.amount ?? e['金額'] ?? 0)}))
                                    .filter(e => Number.isFinite(e.amount) && e.amount > 0)
                                : (() => {
                                    const amount = Number(d.price ?? d['票價'] ?? d['金額'] ?? 0);
                                    return Number.isFinite(amount) && amount > 0 ? [{item:'門票',amount}] : [];
                                  })();
                            return {
                                id: Date.now() + Math.random(),
                                title: String(d.title ?? d['活動名稱']).trim(),
                                artist: String(d.artist ?? d['歌手'] ?? '').trim(),
                                date: formatDate(d.date ?? d['日期']),
                                time: d.time || d['時間'] || '00:00',
                                location: d.location || d['地點'] || '',
                                color: d.color || d['應援色'] || '',
                                expenses,
                                seat: d.seat || d['座位'] || '',
                                memo: d.memo || d['心得'] || '',
                                checklist: Array.isArray(d.checklist) ? d.checklist : [],
                                lat: d.lat == null ? null : Number(d.lat),
                                lng: d.lng == null ? null : Number(d.lng),
                                coverUrl: d.coverUrl || '',
                                sticker: d.sticker || ''
                            };
                        });
                        const keyOf = e => [e.date, String(e.title || '').trim().toLowerCase(), String(e.artist || '').trim().toLowerCase()].join('|');
                        const seen = new Set(events.value.map(keyOf));
                        const additions = incoming.filter(e => {
                            const key = keyOf(e);
                            if (seen.has(key)) return false;
                            seen.add(key); return true;
                        });
                        const duplicates = incoming.length - additions.length;
                        if (!additions.length) { alert('全部 ' + duplicates + ' 筆均為重複行程，原資料未修改。'); return; }
                        if (!confirm('匯入預覽：\n新增 ' + additions.length + ' 筆\n略過重複 ' + duplicates + ' 筆\n原有 ' + events.value.length + ' 筆保留不變。\n確定新增？')) return;
                        events.value = [...events.value, ...additions];
                        importJson.value = '';
                        showImportModal.value = false;
                        alert('已匯入 ' + additions.length + ' 筆行程，略過 ' + duplicates + ' 筆重複行程。');
                    } catch (error) {
                        console.error('JSON 匯入失敗:', error);
                        alert(importMode.value === 'json' ? 'JSON 格式有誤，請檢查引號、逗號、括號。沒有修改資料。' : '表格格式有誤：' + (error.message || '請確認標題列及分隔格式') + '。沒有修改資料。');
                    }
                };

                // Base64 檔案上傳處理函數
                const handleFileUpload = (event, type) => {
                    const file = event.target.files[0];
                    if (!file) return;

                    // 檢查檔案大小，限制在 1MB (1024 * 1024 bytes)
                    if (file.size > 1024 * 1024) {
                        alert('檔案大小超過 1MB 限制，請選擇更小的圖片。');
                        event.target.value = ''; 
                        if (type === 'event') form.value.coverUrl = '';
                        else if (type === 'fandom') fandomForm.value.coverUrl = '';
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const base64String = e.target.result;
                        if (type === 'event') {
                            form.value.coverUrl = base64String;
                        } else if (type === 'fandom') {
                            fandomForm.value.coverUrl = base64String;
                        }
                    };
                    reader.onerror = (error) => {
                        console.error("FileReader 錯誤:", error);
                        alert('讀取圖片失敗，請重試。');
                    };
                    
                    reader.readAsDataURL(file);
                };
                
                const { formatMoney, getDay, getMonth, getDaysDiff } = window.IdolPlannerEvents;

const generateShareImageLegacy = () => {
    const element = document.getElementById('share-template');
    if (!element) return;

    console.log("正在生成圖片...");

    html2canvas(element, {
        useCORS: true,
        scale: 2,               // 建議設為 2，避免手機上圖檔過大下載失敗
        backgroundColor: '#f8fafc',
        windowWidth: 375,       // 鎖定模擬視窗寬度
        width: 375,             // 鎖定擷取範圍寬度
        x: 0,                   // 強制從水平 0 的位置開始抓取
        y: 0,                   // 強制從垂直 0 的位置開始抓取
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
            const clonedElement = clonedDoc.getElementById('share-template');
            // 關鍵：在克隆的文件中將其置頂、靠左，並消除任何外距
            clonedElement.style.position = 'fixed';
            clonedElement.style.top = '0';
            clonedElement.style.left = '0';
            clonedElement.style.margin = '0';
            clonedElement.style.padding = '30px'; // 保持你原本的內距
            clonedElement.style.display = 'flex';
        }
    }).then(canvas => {


        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${selectedYear.value}_追星成就回顧.png`;
            
            // 模擬點擊下載
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 釋放記憶體
            setTimeout(() => URL.revokeObjectURL(url), 100);
        }, 'image/png');
    }).catch(err => {
        console.error("生成失敗:", err);
    });
};








                const generateShareImage = async (mode = 'download') => {
                    if (shareBusy.value) return;
                    shareBusy.value = true;
                    shareError.value = '';
                    try {
                        if (mode === 'share' && shareImagePreview.value) {
                            const blob = await (await fetch(shareImagePreview.value)).blob();
                            const label = selectedYear.value === 'ALL' ? '全部' : String(selectedYear.value);
                            const filename = label + '_追星回顧_限時動態.png';
                            const file = new File([blob], filename, {type:'image/png'});
                            if (navigator.share && navigator.canShare && navigator.canShare({files:[file]})) {
                                try { await navigator.share({files:[file], title:'我的追星回顧'}); return; }
                                catch (err) { if (err.name === 'AbortError') return; }
                            }
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a'); link.href = url; link.download = filename;
                            document.body.appendChild(link); link.click(); link.remove();
                            setTimeout(() => URL.revokeObjectURL(url), 60000);
                            return;
                        }
                        const element = document.getElementById('share-template');
                        if (!element) throw new Error('分享模板尚未載入');
                        await nextTick();
                        if (document.fonts && document.fonts.ready) await document.fonts.ready;
                        // Keep the live preview untouched. html-to-image captures the
                        // computed DOM layout through SVG foreignObject instead of
                        // html2canvas's reimplementation of text metrics (which caused
                        // iOS Safari headings and ranking rows to overlap).
                        let canvas;
                        if (window.htmlToImage && window.htmlToImage.toCanvas) {
                            canvas = await window.htmlToImage.toCanvas(element, {
                                width: 360, height: 640, pixelRatio: 3,
                                backgroundColor: recapPalette.value.background,
                                cacheBust: true,
                                style: { width: '360px', height: '640px', transform: 'none' }
                            });
                        } else {
                            throw new Error('圖片產生工具尚未載入，請重新整理後再試');
                        }
                        if (mode === 'preview') { shareImagePreview.value = canvas.toDataURL('image/png'); return; }
                        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                        if (!blob) throw new Error('圖片產生失敗');
                        const label = selectedYear.value === 'ALL' ? '全部' : String(selectedYear.value);
                        const filename = label + '_追星回顧_限時動態.png';
                        if (mode === 'share' && navigator.share && navigator.canShare) {
                            const file = new File([blob], filename, {type:'image/png'});
                            if (navigator.canShare({files:[file]})) {
                                try {
                                    await navigator.share({files:[file], title:'我的追星回顧'});
                                    return;
                                } catch (err) {
                                    if (err.name === 'AbortError') return;
                                }
                            }
                        }
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = filename;
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        setTimeout(() => URL.revokeObjectURL(url), 60000);
                    } catch (err) {
                        console.error('分享圖片產生失敗', err);
                        shareError.value = '圖片製作失敗，請重試或改用其他瀏覽器。';
                    } finally {
                        shareBusy.value = false;
                    }
                };

                const getMapLink = (l) => l ?
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l)}` : '#';
                return {
                    events, activeTab, viewMode, themeColor, selectedYear, expandedEventId, customTitle,
                    showModal, showSettingsModal, showImportModal, openImportModal, diagnoseImport, showTicketModal, showCalendarModal, showChangelogModal, showFandomModal, fandomForm, isFandomEditing, editFandomIndex,
                    calendarEvent, ticketEvent, isEditing, form, importJson, importMode, readImportFile, searchQuery,
                  
                    cssVars, greetingMessage, filteredEvents, upcomingCount, currentYearExpense, statsData, presetColors, 
              
                    openModal, editEvent, closeModal, saveEvent, deleteEvent, toggleSettingsModal, setTheme, updateCustomTheme, processImport: processImportSafe, showChangelog, generateShareImage, openSharePreview, showShareModal, shareBusy, shareError, shareImagePreview, recapQuote, rerollRecapQuote, shareDistanceAvailable, shareDistanceLabel, 
                    toggleExpand, formatMoney, getDay, getMonth, getDaysDiff, getMapLink, 
                    calculateTotal, 
                    addExpenseItem, removeExpenseItem, addChecklistItem, removeChecklistItem, addDefaultChecklist, saveFandoms, addFandom, removeFandom, editFandom, closeFandomModal, openFandomModal, fandoms,
                    getEventColor, emotionalSummary, recapCities, recapHomeCity, recapKnownCities, recapFarthestCity, recapTopVenue, recapMonths, recapMonthMax, recapPalette, availableYears, searchCoordinates, isSearching, searchError, mappedEventsCount, missingCoordsCount,
    
                    downloadBackup, restoreBackup, idolNagging, showCalendarOptions, addToiCal, addToGoogleCalendar, showTicket, getTicketPrice, updateAppTitle,
                    isColorLight, isThemeColorLight, headerTextColor, appVersion, changelogContent, calculateFandomDays, fandomMessageStatic, calculateDaysToNextDate, calculateYearsAndDaysSinceDebut, getBirthdayCongrats, 
                    getDebutCongrats,
                    handleFileUpload, 
selectedMapYear, filteredMapEventsCount, totalDistance, isYearlyPrivacy, isEventPrivacy, isStatsPrivacy, yearlyBudget, budgetNagging, currentUser, loginEmail, loginWithEmail, logout, lastSyncTime, isInitializing, loadError, retryCloudLoad, 

                };
            }
        }).mount('#app');
