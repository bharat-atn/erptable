import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { t as translate, type UiLang } from "@/lib/ui-translations";

export function useUiLanguage() {
  const [lang, setLang] = useState<UiLang>("en");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { setLoading(false); return; }
      supabase
        .from("profiles")
        .select("preferred_language")
        .eq("user_id", data.user.id)
        .single()
        .then(({ data: profile }) => {
          if (profile?.preferred_language) {
            setLang(profile.preferred_language as UiLang);
          }
          setLoading(false);
        });
    });
  }, []);

  const t = useCallback((key: string) => translate(key, lang), [lang]);

  const setLanguage = useCallback(async (newLang: UiLang) => {
    setLang(newLang);
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await (supabase as any)
        .from("profiles")
        .update({ preferred_language: newLang })
        .eq("user_id", data.user.id);
    }
  }, []);

  return { lang, setLang: setLanguage, t, loading };
}
