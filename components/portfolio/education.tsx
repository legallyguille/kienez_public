"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Sinaes from "@/assets/portfolio/sinaes.png";
import { useTranslation } from "react-i18next";

export default function EducationComponent() {
  const { t, i18n } = useTranslation("common");
  return (
    <div className="sm:flex sm:flex-col lg:flex lg:flex-row max-w-7xl mx-auto pt-32">
      <div className="bg-gray/25 py-24">
        <div className="container mx-auto grid lg:grid-cols-2 gap-8 lg:gap-4">
          {/* Textos - En móvil va después de la imagen, en desktop a la izquierda */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left justify-center p-4 order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-gray-500 font-semibold text-lg mb-2"
            >
              {t("portfolio.education.subtitle")}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.1,
              }}
              className="text-foreground text-5xl lg:text-6xl font-bold text-gray-800 leading-none mb-6"
            >
              {t("portfolio.education.title")}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-gray-700 text-darkgray-700 mb-6 text-start"
            >
              <ul className="list-disc marker:text-blue-500 text-lg ms-5">
                <li>
                  <strong>{t("portfolio.education.t1a")}</strong>
                  <br />
                  {t("portfolio.education.t1b")}
                </li>
                <li>
                  <strong>{t("portfolio.education.t2a")}</strong>
                  <br />
                  {t("portfolio.education.t2b")}
                </li>
                <li>
                  <strong>
                    {t("portfolio.education.t3a")}
                  </strong>
                  <br />
                  {t("portfolio.education.t3b")}
                </li>
                <li>
                  <strong>{t("portfolio.education.t4a")}</strong>
                  <br />
                  {t("portfolio.education.t4b")}
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Imagen - En móvil va primero, en desktop a la derecha */}
          <div className="flex justify-center lg:justify-start p-4 order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-md lg:max-w-full flex justify-center"
            >
              <Image
                // src={Sinaes}
                src="https://storage.googleapis.com/kienez/portfolio/sinaes.png"
                alt="Sinaes"
                width={200}
                height={200}
                className="w-full h-auto rounded-lg"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
