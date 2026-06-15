# 🔍 تشخيص مشكلة الإضافات غير الظاهرة

## 📋 ما يجب أن تراه في Terminal الآن:

### **1. قائمة كاملة بجميع الإضافات المثبتة:**

```
[addon-source] === GATHERING SUBTITLE ADDONS ===
[addon-source] Auth key present: true
[addon-source] Cloud addons: 5
[addon-source] Cloud addon names: Torrentio, Comet, AIOStreams, Cinemeta, OpenSubtitles V3
[addon-source] Total local installed addons: 8
[addon-source] Local installed names: SubSource, SubDL, Anime Kitsu, ...
[addon-source] Local addons (not in cloud): 3
```

**أول شيء:** تحقق من `Local installed names` - يجب أن ترى **جميع** إضافات الترجمة التي ثبّتها

---

### **2. معرفة أي إضافة ليس لديها "subtitles" resource:**

```
[addon-source] Torrentio does NOT have subtitle resource. Resources: ["stream", "meta"]
[addon-source] Comet does NOT have subtitle resource. Resources: ["stream"]
[addon-source] Anime Kitsu does NOT have subtitle resource. Resources: ["catalog", "meta"]
```

**إذا رأيت إضافة ترجمة هنا** → **المشكلة: الإضافة لا تصرّح عن "subtitles" في manifest**

---

### **3. النتيجة النهائية للإضافات مع subtitles:**

```
[addon-source] === RESULT: 4 addons with subtitle resource ===
[addon-source] Subtitle addon names: AIOStreams, OpenSubtitles V3, SubSource, SubDL
```

**هنا يجب أن ترى جميع إضافات الترجمة!**

---

### **4. التحقق من قبول الإضافات للمحتوى:**

```
[addons] searchAddons called with 4 addons
[addons] Content ID: tt1234567, Type: movie
[addons] Torrentio does NOT accept movie/tt1234567
[addons] === Filtered subtitle addons: 3 of 4 ===
[addons] Accepting addons: AIOStreams, SubSource, SubDL
```

**إذا رأيت:** `does NOT accept` → **الإضافة موجودة لكنها لا تدعم هذا النوع من المحتوى**

---

## 🎯 السيناريوهات المحتملة:

### ✅ **سيناريو 1: كل شيء يعمل**
```
[addon-source] Subtitle addon names: AIOStreams, OpenSubtitles V3, SubSource, SubDL
[addons] Accepting addons: AIOStreams, SubSource, SubDL
[addons] AIOStreams returned 25 subtitles
[addons] SubSource returned 12 subtitles
[addons] SubDL returned 8 subtitles
[addons] Total addon results: 45
```

**النتيجة:** ستظهر ترجمات من جميع المصادر مع ألوان مختلفة! 🎉

---

### ❌ **سيناريو 2: إضافة مثبتة لكن لا تظهر في القائمة**
```
[addon-source] Local installed names: SubSource, SubDL, MyCustomAddon, ...
[addon-source] MyCustomAddon does NOT have subtitle resource. Resources: ["meta"]
[addon-source] Subtitle addon names: AIOStreams, OpenSubtitles V3, SubSource, SubDL
```

**المشكلة:** `MyCustomAddon` **ليس لديها subtitle resource**

**الحل:** 
- هذه الإضافة لا توفر ترجمات (قد تكون فقط للـ streams أو meta)
- ابحث عن إضافة أخرى توفر subtitles

---

### ❌ **سيناريو 3: إضافة موجودة لكن لا تقبل المحتوى**
```
[addon-source] Subtitle addon names: AIOStreams, OpenSubtitles V3, SubSource, SubDL
[addons] SubSource does NOT accept series/tt1234567:1:1
[addons] Accepting addons: AIOStreams, SubDL
```

**المشكلة:** `SubSource` **لا تدعم المسلسلات** (أو العكس)

**الحل:**
- هذا طبيعي! بعض الإضافات تدعم فقط أفلام أو مسلسلات
- جرب محتوى من نوع مختلف

---

### ❌ **سيناريو 4: إضافة تقبل لكن لا ترجمات**
```
[addon-source] Subtitle addon names: AIOStreams, OpenSubtitles V3, SubSource
[addons] Accepting addons: AIOStreams, SubSource
[addons] Fetching from SubSource: https://...
[addons] SubSource returned 0 subtitles
[addons] Fetching from AIOStreams: https://...
[addons] AIOStreams returned 30 subtitles
```

**المشكلة:** `SubSource` **لا تحتوي على ترجمات** لهذا المحتوى المحدد

**الحل:**
- هذا طبيعي! ليس كل إضافة لديها ترجمات لكل محتوى
- المهم أن الإضافة تعمل وتُجرّب
- جرب محتوى آخر أكثر شهرة

---

## 🔎 إضافات الترجمة الشائعة:

### **إضافات يجب أن تظهر في القائمة:**

1. **OpenSubtitles V3** ✅
   - Resources: `["subtitles"]`
   - دعم: Movies + Series
   - الأكثر شمولاً

2. **SubSource** (formerly SubScene) ✅
   - Resources: `["subtitles"]`
   - دعم: Movies + Series
   - جيد للغات الأجنبية

3. **SubDL** ✅
   - Resources: `["subtitles"]`
   - دعم: Movies + Series
   - مجمّع ترجمات

4. **AIOStreams** ✅
   - Resources: `["stream", "subtitles"]`
   - دعم: Movies + Series
   - يجمع streams + subtitles

### **إضافات لن تظهر (وهذا طبيعي):**

- **Torrentio** ❌ - فقط streams
- **Comet** ❌ - فقط streams  
- **Cinemeta** ❌ - فقط metadata
- **Anime Kitsu** ❌ - فقط anime metadata

---

## 📤 أرسل لي:

1. **السطور من:** `[addon-source] === GATHERING SUBTITLE ADDONS ===`
2. **حتى:** `[SUBTITLES SEARCH] Complete:`
3. **أسماء الإضافات التي ثبّتها من قسم Addons**

---

## 💡 نصيحة إضافية:

إذا ثبّتت إضافة جديدة:
1. **أعد تشغيل التطبيق** بالكامل (Quit + npm run tauri dev)
2. جرب البحث عن الترجمات مرة أخرى
3. راقب Terminal للتأكد من ظهور الإضافة الجديدة

---

**الهدف:** نريد أن نرى في Terminal:
```
[addon-source] Subtitle addon names: AIOStreams, OpenSubtitles V3, SubSource, SubDL, [إضافتك الأخرى]
```

وبعدها:
```
[addons] Accepting addons: [نفس القائمة أو أقل حسب نوع المحتوى]
[addons] [اسم الإضافة] returned X subtitles
```

هذا يؤكد أن كل شيء يعمل! 🎯
