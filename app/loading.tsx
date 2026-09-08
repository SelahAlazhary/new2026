export default function Loading() {
  return (
    <main className="loading-screen" aria-busy="true" aria-live="polite">
      <div className="loading-atmosphere" aria-hidden="true" />
      <section className="loading-panel">
        <div className="loading-seal" aria-hidden="true">
          <span className="loading-seal-core">م</span>
        </div>
        <div className="loading-copy">
          <p className="loading-eyebrow">منصّات</p>
          <h1>نجهّز تجربتك</h1>
          <p className="loading-caption">لحظات ونفتح لك المساحة كاملة</p>
        </div>
        <div className="loading-progress" aria-hidden="true">
          <span className="loading-progress-fill" />
        </div>
        <div className="loading-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span className="sr-only">جارٍ تحميل الصفحة</span>
      </section>
    </main>
  );
}