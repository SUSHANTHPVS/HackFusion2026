import { useEffect, useRef, useState } from "react";
import { GOOGLE_CLIENT_ID } from "../utils/constants";

const GSI_HANDLER_KEY = "__googleGsiCredentialHandler";
const GSI_CLIENT_KEY = "__googleGsiInitializedClientId";

function loadGoogleScript() {
  const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
  if (existing) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google auth script"));
    document.body.appendChild(script);
  });
}

export function GoogleAuthButton({ text = "signin_with", onToken, disabled = false }) {
  const containerRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function setup() {
      if (!GOOGLE_CLIENT_ID) {
        setError("Google sign-in is not configured. Set VITE_GOOGLE_CLIENT_ID in client/.env and restart Vite.");
        return;
      }

      try {
        await loadGoogleScript();
        if (!isMounted || !window.google?.accounts?.id || !containerRef.current) {
          return;
        }

        window[GSI_HANDLER_KEY] = onToken;

        if (window[GSI_CLIENT_KEY] !== GOOGLE_CLIENT_ID) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response) => {
              if (response?.credential && typeof window[GSI_HANDLER_KEY] === "function") {
                window[GSI_HANDLER_KEY](response.credential);
              }
            }
          });
          window[GSI_CLIENT_KEY] = GOOGLE_CLIENT_ID;
        }

        containerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
          text,
          width: 320
        });
      } catch (_error) {
        if (isMounted) {
          setError("Google sign-in button could not be loaded.");
        }
      }
    }

    setup();

    return () => {
      isMounted = false;
    };
  }, [onToken, text]);

  return (
    <div className="grid gap-2">
      <div ref={containerRef} className={disabled ? "pointer-events-none opacity-70" : ""} />
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
}
