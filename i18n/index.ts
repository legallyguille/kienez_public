"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "./locales/en/common.json";
import esCommon from "./locales/es/common.json";

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      lng: "en",
      fallbackLng: "en",
      debug: process.env.NODE_ENV === "development",
      interpolation: {
        escapeValue: false,
      },
      resources: {
        en: {
          common: enCommon,
        },
        es: {
          common: esCommon,
        },
      },
    });
}

export default i18n;
