export default function EmbedLayout({ children }) {
  return (
    <div className="embed-layout min-h-screen bg-transparent">
      <style dangerouslySetInnerHTML={{ __html: `
        .qlynk-bg-container { display: none !important; }
        body { background: transparent !important; }
      ` }} />
      {children}
    </div>
  );
}
