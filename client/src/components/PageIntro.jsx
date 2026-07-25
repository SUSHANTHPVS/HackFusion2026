export function PageIntro({ title, description }) {
  return (
    <header className="glass-card rounded-2xl p-6">
      <h1 className="text-3xl font-extrabold text-slate-900">{title}</h1>
      <p className="mt-2 max-w-3xl text-slate-600">{description}</p>
    </header>
  );
}
