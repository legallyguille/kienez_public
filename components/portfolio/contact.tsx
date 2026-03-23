"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import Contact from "@/assets/portfolio/contact.jpg";
import { FaWhatsapp, FaLinkedin, FaGithub } from "react-icons/fa";
import { SiGmail } from "react-icons/si";
import { IoMdPin } from "react-icons/io";
import { FaFolderTree } from "react-icons/fa6";
import { IoLogoWhatsapp } from "react-icons/io";
import { useTranslation } from "react-i18next";

export default function ContactComponent() {
  const { t, i18n } = useTranslation("common");

  return (
    <div className="sm:flex sm:flex-col lg:flex lg:flex-row max-w-7xl mx-auto">
      <div className="bg-gray/25 py-12">
        <div className="container mx-auto grid lg:grid-cols-2 gap-8 lg:gap-4">
          {/* Imagen - En móvil va primero, en desktop a la derecha */}
          <div className="flex justify-center lg:justify-start p-4 order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-md lg:max-w-full flex justify-center"
            >
              <Image
                //src={Contact}
                src="https://storage.googleapis.com/kienez/portfolio/contact.jpg"
                alt="Contact"
                width={100}
                height={200}
                className="w-full h-auto rounded-lg"
              />
            </motion.div>
          </div>
          {/* Textos - En móvil va después de la imagen, en desktop a la izquierda */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left justify-center p-4 order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-gray-500 font-semibold text-lg mb-2"
            >
              {t("portfolio.contact.subtitle")}
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
              {t("portfolio.contact.title")}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg text-gray-700 mb-6"
            >
              <ul className="text-xl">
                <li className="py-2">
                  <Link
                    href="https://www.google.com/maps/place/La+Cruz,+Guanacaste,+Costa+Rica"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IoMdPin className="inline" /> {t("portfolio.contact.t1")}
                  </Link>
                </li>
                <li className="py-2">
                  <Link
                    href="mailto:guimachu@gmail.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <SiGmail className="inline" /> {t("portfolio.contact.t2")}
                  </Link>
                </li>
                <li className="py-2">
                  <Link
                    href="https://wa.me/50686502638"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IoLogoWhatsapp className="inline" />{" "}
                    {t("portfolio.contact.t3")}
                  </Link>
                </li>
                <li className="py-2">
                  <Link
                    href="https://www.linkedin.com/in/guillermo-antonio-castrillo-toledo-230738152/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaLinkedin className="inline hover:scale-125" />{" "}
                    {t("portfolio.contact.t4a")}
                  </Link>
                  <Link
                    href="https://www.kienez.com/portfolio"
                    rel="noopener noreferrer"
                  >
                    <FaFolderTree className="inline ms-4 hover:scale-125" />{" "}
                    {t("portfolio.contact.t4b")}
                  </Link>
                  <Link
                    href="https://github.com/legallyguille"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaGithub className="inline ms-4 hover:scale-125" />{" "}
                    {t("portfolio.contact.t4c")}
                  </Link>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
