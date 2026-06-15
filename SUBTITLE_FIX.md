# Subtitle System Fix - حل مشكلة نظام الترجمة

## 🔍 المشكلة الأصلية | Original Problem

**العربية:**
كانت الترجمات تظهر فقط من مصدر OpenSubtitles، حتى عند تثبيت إضافات أخرى للترجمة. المشكلة كانت في توقيت البحث حيث يتم البحث قبل تحميل الإضافات بالكامل.

**English:**
Subtitles were only appearing from OpenSubtitles source, even when other subtitle addons were installed. The issue was in the search timing - the search was executing before all addons were fully loaded.

---

## 🛠️ الإصلاحات المطبقة | Applied Fixes

### 1. **تحسين توقيت البحث | Improved Search Timing**

**قبل | Before:**
```typescript
useEffect(() => {
  if (!metaImdbId || addons === null || results !== null) return;
  void run();
}, [metaImdbId, addons]);
```

**بعد | After:**
```typescript
const [addonsLoading, setAddonsLoading] = useState(true);
const initialSearchDone = useRef(false);

useEffect(() => {
  // Only run initial auto-search once, after addons are loaded
  if (!metaImdbId || addons === null || addonsLoading || initialSearchDone.current) return;
  initialSearchDone.current = true;
  void run();
}, [metaImdbId, addons, addonsLoading]);
```

**الفائدة | Benefit:**
- انتظار تحميل جميع الإضافات قبل البدء بالبحث
- تجنب البحث المتكرر
- ضمان تضمين جميع مصادر الترجمة

---

### 2. **إضافة مراقبة للتحميل | Added Loading Monitoring**

```typescript
const [addonsLoading, setAddonsLoading] = useState(true);

useEffect(() => {
  let cancelled = false;
  setAddonsLoading(true);
  gatherSubtitleAddons(authKey)
    .then((a) => {
      if (!cancelled) {
        setAddons(a);
        setAddonsLoading(false);
      }
    })
    .catch(() => {
      if (!cancelled) {
        setAddons([]);
        setAddonsLoading(false);
      }
    });
  // ...
}, [authKey]);
```

**الفائدة | Benefit:**
- تتبع حالة تحميل الإضافات بدقة
- عرض رسالة واضحة للمستخدم أثناء التحميل

---

### 3. **تحسين السجلات للتشخيص | Enhanced Logging for Debugging**

```typescript
console.log('[subtitles] Starting search with:', {
  hasImdbId: !!metaImdbId,
  addonsCount: addons?.length ?? 0,
  providers: searchOpts.providers,
});

const r = await searchSubtitles(searchQuery, searchOpts);

const bySource = r.reduce((acc, sub) => {
  acc[sub.source] = (acc[sub.source] || 0) + 1;
  return acc;
}, {} as Record<string, number>);
console.log('[subtitles] Search complete:', { total: r.length, bySource });
```

**الفائدة | Benefit:**
- تسهيل اكتشاف المشاكل في المستقبل
- عرض عدد النتائج من كل مصدر
- مراقبة أداء البحث

---

### 4. **تحسين عرض المصادر | Improved Source Display**

```typescript
const sourceColor = {
  addon: "text-blue-400",
  opensubtitles: "text-emerald-400",
  wyzie: "text-purple-400",
  jimaku: "text-amber-400",
}[result.source] || "text-ink-subtle";
```

**الفائدة | Benefit:**
- التمييز البصري بين المصادر المختلفة
- سهولة معرفة مصدر كل ترجمة
- تحسين تجربة المستخدم

**ألوان المصادر | Source Colors:**
- 🔵 **Addon** (إضافات مخصصة) - أزرق | Blue
- 🟢 **OpenSubtitles** - أخضر زمردي | Emerald
- 🟣 **Wyzie** - بنفسجي | Purple
- 🟡 **Jimaku** - كهرماني | Amber

---

### 5. **مؤشر تحميل محسّن | Enhanced Loading Indicator**

```typescript
{loading && results == null && (
  <p className="flex items-center gap-2 px-4 py-3 text-[13px] text-ink-muted">
    <Loader2 size={14} className="animate-spin" />
    {addonsLoading 
      ? t("Loading subtitle addons…")
      : t("Searching {count} sources…", { count: 1 + (addons?.length ?? 0) })}
  </p>
)}
```

**الفائدة | Benefit:**
- عرض عدد المصادر التي يتم البحث فيها
- رسائل واضحة حسب حالة التحميل
- شفافية أكبر للمستخدم

---

## 📋 ملفات التعديل | Modified Files

1. **src/components/player/subtitle-menu/search-section.tsx**
   - تحسين منطق البحث
   - إضافة تتبع حالة التحميل
   - تحسين عرض النتائج

2. **src/lib/i18n/locales/ar/player.ts**
   - إضافة ترجمات جديدة للرسائل

---

## ✅ النتيجة المتوقعة | Expected Result

**قبل | Before:**
- ✗ ترجمات فقط من OpenSubtitles
- ✗ الإضافات لا تظهر في النتائج
- ✗ لا توجد مؤشرات واضحة للمصادر

**بعد | After:**
- ✓ جميع المصادر تظهر في النتائج (OpenSubtitles + جميع الإضافات)
- ✓ ألوان مميزة لكل مصدر
- ✓ عداد واضح لعدد المصادر التي يتم البحث فيها
- ✓ سجلات console لتسهيل التشخيص

---

## 🧪 كيفية الاختبار | How to Test

1. **تثبيت إضافات ترجمة إضافية:**
   - افتح قسم الإضافات (Addons)
   - ابحث عن "SubSource" أو "SubDL" أو أي إضافة ترجمة أخرى
   - قم بتثبيتها

2. **فتح مشغل الفيديو:**
   - افتح أي فيلم أو مسلسل
   - اضغط على أيقونة الترجمة (CC)

3. **البحث عن الترجمات:**
   - اضغط على "Find more subtitles" (ابحث عن المزيد من الترجمات)
   - راقب رسالة التحميل - يجب أن تعرض عدد المصادر
   - افحص console في Developer Tools لرؤية السجلات

4. **التحقق من النتائج:**
   - يجب أن ترى ترجمات من مصادر متعددة
   - كل مصدر له لون مميز
   - تحقق من وجود نتائج بعلامة "addon" (زرقاء)

---

## 🔧 استكشاف الأخطاء | Troubleshooting

### المشكلة: لا تزال الترجمات من OpenSubtitles فقط
**الحل:**
1. افتح Developer Console (F12)
2. ابحث عن رسالة `[subtitles] Search complete:`
3. تحقق من `addonsCount` - يجب أن يكون > 0
4. تحقق من `bySource` - يجب أن يعرض عدة مصادر

### المشكلة: الإضافات لا تحمّل
**الحل:**
1. تأكد من أن الإضافات مثبتة ونشطة
2. تحقق من أن الإضافات تدعم "subtitles" resource
3. افحص سجلات console للأخطاء

---

## 📝 ملاحظات إضافية | Additional Notes

- الإصلاح يعمل مع جميع أنواع إضافات الترجمة
- لا يؤثر على أداء البحث
- متوافق مع جميع المصادر الموجودة (OpenSubtitles, Wyzie, Jimaku, Addons)
- يدعم البحث في أفلام ومسلسلات

---

**تاريخ التحديث | Update Date:** 2026-06-15
**الإصدار | Version:** v0.9.9+
