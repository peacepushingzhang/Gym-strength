"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { repositoryMode } from "@/lib/repository";
import { FormApp } from "./FormApp";

export function AuthGate() {
  if (repositoryMode === "local") return <FormApp />;
  return <CloudAuthGate />;
}

function CloudAuthGate() {
  const { data: session, isPending } = authClient.useSession();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (isPending) {
    return <main className="loading-screen"><LoaderCircle className="spin" /><span>正在确认登录状态</span></main>;
  }

  if (session) {
    return (
      <FormApp
        userEmail={session.user.email}
        onSignOut={async () => {
          await authClient.signOut();
        }}
      />
    );
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const result = mode === "signUp"
      ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
      : await authClient.signIn.email({ email: email.trim(), password });
    setSubmitting(false);

    if (result.error) {
      setError(result.error.message ?? "登录失败，请检查输入后重试");
    }
  };

  return (
    <main className="auth-screen page-enter">
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-brand"><span>FORM</span><i /></div>
        <p className="eyebrow">云端训练档案</p>
        <h1 id="auth-title">{mode === "signIn" ? "继续你的训练记录" : "建立你的 FORM 账号"}</h1>
        <p className="auth-intro">登录后，身体数据、训练记录与 PR 会安全地同步到你的个人数据库空间。</p>

        <form className="auth-form" onSubmit={submit}>
          {mode === "signUp" ? (
            <label>
              <span>称呼</span>
              <input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" />
            </label>
          ) : null}
          <label>
            <span>邮箱</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          </label>
          <label>
            <span>密码</span>
            <input type="password" minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete={mode === "signIn" ? "current-password" : "new-password"} />
          </label>
          {error ? <p className="auth-error" role="alert">{error}</p> : null}
          <button className="button primary wide" type="submit" disabled={submitting}>
            {submitting ? <LoaderCircle className="spin" size={17} /> : null}
            {mode === "signIn" ? "登录" : "注册并进入"}
          </button>
        </form>

        <button
          className="auth-switch"
          type="button"
          onClick={() => {
            setMode(mode === "signIn" ? "signUp" : "signIn");
            setError("");
          }}
        >
          {mode === "signIn" ? "还没有账号？创建账号" : "已有账号？返回登录"}
        </button>
      </section>
    </main>
  );
}

