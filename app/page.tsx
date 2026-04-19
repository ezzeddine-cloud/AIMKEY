"use client";

import { useState } from "react";
import { useDimaApp } from "@/controllers/useDimaApp";
import { DimaAppView } from "@/views/DimaAppView";
import { LoginView } from "@/views/LoginView";
import { LandingView } from "@/views/LandingView";
import { SplashScreen } from "@/views/SplashScreen";
import { ArrowLeft } from "lucide-react";

export default function HomePage() {
  const c = useDimaApp();
  const [showLogin, setShowLogin] = useState(false);

  if (!c.ready) {
    return <SplashScreen />;
  }

  if (!c.sessionActive) {
    if (showLogin) {
      return (
        <div className="relative min-h-screen">
          <button
            onClick={() => setShowLogin(false)}
            className="absolute top-4 left-4 sm:top-8 sm:left-8 z-50 p-3 rounded-full bg-white/50 backdrop-blur-md border border-white shadow-sm hover:bg-white transition-colors"
          >
            <ArrowLeft size={20} className="text-zinc-600" />
          </button>
          <LoginView
            t={c.t}
            isRTL={c.isRTL}
            lang={c.lang}
            setLang={c.setLang}
            signIn={c.signIn}
            signUp={c.signUp}
            signInWithGoogle={c.signInWithGoogle}
            googleProfilePending={c.googleProfilePending}
            completeGoogleProfile={c.completeGoogleProfile}
            cancelGoogleProfile={c.cancelGoogleProfile}
            authError={c.authError}
            firebaseConfigured={c.firebaseConfigured}
            pendingEmailVerification={c.pendingEmailVerification}
            resendEmailVerification={c.resendEmailVerification}
            reloadAuthUser={c.reloadAuthUser}
            sendPasswordReset={c.sendPasswordReset}
            logout={c.logout}
          />
        </div>
      );
    }

    return (
      <LandingView
        t={c.t}
        isRTL={c.isRTL}
        lang={c.lang}
        setLang={c.setLang}
        onLoginClick={() => setShowLogin(true)}
      />
    );
  }

  if (!c.userUid) {
    return <SplashScreen />;
  }

  return (
    <DimaAppView
      role={c.role}
      userUid={c.userUid}
      userEmail={c.userEmail}
      lang={c.lang}
      setLang={c.setLang}
      activeTab={c.activeTab}
      setActiveTab={c.setActiveTab}
      events={c.events}
      isRTL={c.isRTL}
      t={c.t}
      logout={c.logout}
    />
  );
}
