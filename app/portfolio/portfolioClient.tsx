"use client";

import "@/i18n";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { FaArrowDown } from "react-icons/fa";
import { SiGmail } from "react-icons/si";
import Image from "next/image";
import Pic from "@/assets/portfolio/pic.jpeg";
import { Card } from "@/components/ui/card";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Logo from "@/assets/header/kienez-logo.png";
import { Button } from "@/components/ui/button";
import Img0 from "@/assets/portfolio/img0.jpg";
import Img1 from "@/assets/portfolio/img1.png";
import Img2 from "@/assets/portfolio/img2.jpg";
import Img3 from "@/assets/portfolio/img3.jpg";
import Img4 from "@/assets/portfolio/img4.jpg";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import EducationComponent from "@/components/portfolio/education";
import ContactComponent from "@/components/portfolio/contact";

type Props = {
  isGuest: boolean;
  user: { id: number; nombre: string; role: string } | null;
};

export default function PortfolioClient({ isGuest, user }: Props) {
  const { t, i18n } = useTranslation("common");

  //  const [ready, setReady] = useState(false);

  // useEffect(() => {
  //   if (i18n.isInitialized) {
  //     setReady(true);
  //   }
  // }, [i18n]);

  // if (!ready) {
  //   return null; // o un skeleton
  // }

  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 20,
    mass: 0.4,
  });

  const s2 = useTransform(smoothScroll, [0.2, 0.4], ["100%", "0%"]);
  const opacity2 = useTransform(smoothScroll, [0.2, 0.4], [0.6, 1]);

  const s3 = useTransform(smoothScroll, [0.4, 0.6], ["100%", "0%"]);
  const opacity3 = useTransform(smoothScroll, [0.4, 0.6], [0.6, 1]);

  const s4 = useTransform(smoothScroll, [0.6, 0.8], ["100%", "0%"]);
  const opacity4 = useTransform(smoothScroll, [0.6, 0.8], [0.6, 1]);

  const s5 = useTransform(smoothScroll, [0.8, 1], ["100%", "0%"]);
  const opacity5 = useTransform(smoothScroll, [0.8, 1], [0.6, 1]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            <Image src={Logo} alt="Kienez" width={150} height={60} />
          </Link>

          {isGuest ? (
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline">Iniciar Sesión</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-700 hover:to-purple-800">
                  Registrarse
                </Button>
              </Link>
            </div>
          ) : (
            <span className="text-sm text-gray-600">Hola, {user?.nombre}</span>
          )}
        </div>
      </header>
      <motion.div
        className="sm:flex sm:flex-col lg:flex lg:flex-row max-w-7xl mx-auto pt-28 pb-4 px-2 justify-center"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        // transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{
          scale: [null, 1.2, 1.2],
          transition: { duration: 0.5 },
        }}
        transition={{
          duration: 0.3,
          ease: "easeOut",
        }}
      >
        <Button
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-700 hover:to-purple-800 text-white hover:text-gray-200 w-full lg:w-64 text-lg font-bold"
          variant="ghost"
          onClick={() =>
            i18n.changeLanguage(i18n.language === "es" ? "en" : "es")
          }
        >
          {i18n.language === "es" ? "English" : "Español"}
        </Button>
      </motion.div>
      <div className="sm:flex sm:flex-col lg:flex lg:flex-row max-w-7xl mx-auto">
        <aside className="lg:sticky lg:max-w-2xl sm:w-5/6 md:w-3/4 lg:w-1/3 p-2 top-32 h-fit">
          <motion.h1
            className="text-5xl font-bold"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            Guillermo Castrillo Toledo
          </motion.h1>
          <motion.h3
            className="text-2xl font-semibold mt-4"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {t("portfolio.aside.t1")}
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-6 text-gray-700"
          >
            {t("portfolio.aside.t2")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-row space-y-1 mt-4 justify-center lg:justify-start"
          >
            <Link
              href="https://github.com/legallyguille"
              className="mx-3 content-end"
              target="_blank"
            >
              <FaGithub className="w-6 h-6 mb-4 hover:scale-125" />
            </Link>
            <Link
              href="https://www.linkedin.com/in/guillermo-antonio-castrillo-toledo-230738152/"
              className="mx-3 content-center"
              target="_blank"
            >
              <FaLinkedin className="w-6 h-6 mb-4 hover:scale-125" />
            </Link>
            <Link
              href="mailto:guimachu@gmail.com"
              className="mx-3 content-center"
              target="_blank"
            >
              <SiGmail className="w-6 h-6 mb-4 hover:scale-125" />
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex justify-center lg:justify-start pb-8 lg:pb-2"
          >
            <Image
              src="https://storage.googleapis.com/kienez/portfolio/pic.jpeg"
              alt="Guillermo Castrillo Toledo"
              width={180}
              height={180}
              className="rounded-full hover:scale-125 mt-6"
            />
          </motion.div>
        </aside>
        <main className="flex-1 lg:max-w-2xl mx-auto p-2 space-y-6">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl font-bold mb-4"
            >
              {t("portfolio.aboutMe.t1")}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-gray-700 text-lg pb-4 border-b-4 border-purple-600"
            >
              {t("portfolio.aboutMe.t2")}
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="pt-12"
          >
            <Card className="p-4">
              <div className="lg:grid lg:grid-cols-3 gap-4">
                <div className="pb-4">
                  <p className="font-semibold">
                    {t("portfolio.experience.c1date1")}
                  </p>
                  <p className="font-semibold">
                    {t("portfolio.experience.c1date2")}
                  </p>
                </div>
                <div className="col-span-2 text-gray-700">
                  <h3 className="text-xl font-bold">
                    {t("portfolio.experience.c1title")}
                  </h3>
                  <ul className="list-disc marker:text-sky-500 text-lg">
                    <li>{t("portfolio.experience.c1t1")}</li>
                    <li>{t("portfolio.experience.c1t2")}</li>
                  </ul>
                  {/* <div className="lg:grid lg:grid-cols-2 pt-4"> */}
                  <div className="flex flex-row">
                    <Link
                      href="https://www.kienez.com/"
                      className="pt-4 inline-block"
                      target="_blank"
                    >
                      <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-700 hover:to-purple-800 me-2">
                        {t("portfolio.experience.c1btn1")}
                      </Button>
                    </Link>
                    {i18n.language === "en" ? (
                      <Link
                        href="https://www.kienez.com/kvideos/2"
                        className="pt-4 inline-block"
                        target="_blank"
                      >
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-700 hover:to-purple-800">
                          {t("portfolio.experience.c1btn2")}
                        </Button>
                      </Link>
                    ) : (
                      <Link
                        href="https://www.kienez.com/kvideos/1"
                        className="pt-4 inline-block"
                        target="_blank"
                      >
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-700 hover:to-purple-800">
                          {t("portfolio.experience.c1btn2")}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Card className="p-4">
              <div className="lg:grid lg:grid-cols-3 gap-4">
                <div className="pb-4">
                  <p className="font-semibold">
                    {t("portfolio.experience.c2date1")}
                  </p>
                  <p className="font-semibold">
                    {t("portfolio.experience.c2date2")}
                  </p>
                </div>
                <div className="col-span-2 text-gray-700">
                  <h3 className="text-xl font-bold">
                    {t("portfolio.experience.c2title")}
                  </h3>
                  <ul className="list-disc marker:text-sky-400 text-lg">
                    <li>{t("portfolio.experience.c2t1")}</li>
                    <li>{t("portfolio.experience.c2t2")}</li>
                  </ul>
                  <Link
                    href="https://www.danielconstruye.cr/"
                    className="pt-4 inline-block"
                    target="_blank"
                  >
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-700 hover:to-purple-800">
                      {t("portfolio.experience.c2btn1")}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <Card className="p-4">
              <div className="lg:grid lg:grid-cols-3 gap-4">
                <div className="pb-4">
                  <p className="font-semibold">
                    {t("portfolio.experience.c3date1")}
                  </p>
                  <p className="font-semibold">
                    {t("portfolio.experience.c3date2")}
                  </p>
                </div>
                <div className="col-span-2 text-gray-700">
                  <h3 className="text-xl font-bold">
                    {t("portfolio.experience.c3title")}
                  </h3>
                  <ul className="list-disc marker:text-sky-400 text-lg">
                    <li>{t("portfolio.experience.c3t1")}</li>
                    <li>{t("portfolio.experience.c3t2")}</li>
                    <li>{t("portfolio.experience.c3t3")}</li>
                  </ul>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <Card className="p-3">
              <div className="lg:grid lg:grid-cols-3 gap-4">
                <div className="pb-4">
                  <p className="font-semibold">
                    {t("portfolio.experience.c4date1")}
                  </p>
                  <p className="font-semibold">
                    {t("portfolio.experience.c4date2")}
                  </p>
                </div>
                <div className="col-span-2 text-gray-700">
                  <h3 className="text-xl font-bold">
                    {t("portfolio.experience.c4title")}
                  </h3>
                  <ul className="list-disc marker:text-sky-400 text-lg">
                    <li>{t("portfolio.experience.c4t1")}</li>
                    <li>{t("portfolio.experience.c4t2")}</li>
                    <li>{t("portfolio.experience.c4t3")}</li>
                    <li>{t("portfolio.experience.c4t4")}</li>
                    <li>{t("portfolio.experience.c4t5")}</li>
                  </ul>
                  {/* </div><div className="lg:grid lg:grid-cols-2 pt-4"> */}
                  <div className="flex flex-row">
                    <Link
                      href="https://train-in.cr/"
                      className="pt-4 pe-2 inline-block"
                      target="_blank"
                    >
                      <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-700 hover:to-purple-800">
                        {t("portfolio.experience.c4btn1")}
                      </Button>
                    </Link>
                    <Link
                      href="https://www.train-in.academy/"
                      className="pt-4 inline-block"
                      target="_blank"
                    >
                      <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-700 hover:to-purple-800">
                        {t("portfolio.experience.c4btn2")}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </main>
      </div>

      {/* Parallax Background */}
      <div
        ref={containerRef}
        className="relative h-[500vh] overflow-visible pt-16"
      >
        {/* skill 1 */}
        <div className="sticky top-0 h-screen overflow-visible">
          {/* <motion.div
            className="absolute inset-0 will-change-transform"
            style={{
              y: s1,
              opacity: opacity1,
              zIndex: 2, 
              backgroundColor: "rgba(255, 255, 255)" }}
          > */}
          {/* Imagen de fondo */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('${Img0.src}')`,
              opacity: 0.4,
            }}
          ></div>

          {/* Contenido */}
          <div className="relative z-10 flex flex-col h-full items-center justify-center text-center pointer-events-none">
            <div className="max-w-3xl px-6 pointer-events-auto">
              <motion.h3
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="text-4xl lg:text-6xl font-extrabold text-primary mb-4"
              >
                {t("portfolio.skills.t1")}
              </motion.h3>
            </div>
            <div className="font-xxl">
              <FaArrowDown />
            </div>
          </div>
          {/* </motion.div> */}
        </div>

        {/* skill 2 */}
        <div className="sticky top-0 h-screen overflow-visible">
          <motion.div
            className="absolute inset-0 will-change-transform"
            style={{
              y: s2,
              opacity: opacity2,
              zIndex: 3,
              backgroundColor: "rgba(255, 255, 255)",
            }}
          >
            {/* Imagen de fondo */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('${Img1.src}')`,
                opacity: 0.3,
              }}
            ></div>

            {/* Contenido */}
            <div className="relative z-10 flex h-full items-center justify-center text-center pointer-events-none">
              <div className="max-w-3xl px-6 pointer-events-auto">
                <motion.h3
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="text-4xl lg:text-6xl font-extrabold text-primary mb-4"
                >
                  Frontend
                </motion.h3>

                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="text-2xl md:text-2xl font-bold text-foreground mb-8 pb-2 border-b-4 border-purple-600"
                >
                  <ul>
                    <li>React.js, Next.js</li>
                    <li>TypeScript, Redux</li>
                    <li>Adapt Learning & Adapt Framework</li>
                    <li>HTML5, CSS3, JavaScript (ES6+)</li>
                    <li>API RESTful, Fetch, Axios</li>
                    <li>Bootstrap, Tailwind, Motion.dev</li>
                  </ul>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* skill 3 */}
        <div className="sticky top-0 h-screen overflow-visible">
          <motion.div
            className="absolute inset-0 will-change-transform"
            style={{
              y: s3,
              opacity: opacity3,
              zIndex: 4,
              backgroundColor: "rgba(255, 255, 255)",
            }}
          >
            {/* Imagen de fondo */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('${Img2.src}')`,
                opacity: 0.3,
              }}
            ></div>

            {/* Contenido */}
            <div className="relative z-10 flex h-full items-center justify-center text-center pointer-events-none">
              <div className="max-w-3xl px-6 pointer-events-auto">
                <motion.h3
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="text-4xl lg:text-6xl font-extrabold text-primary mb-4"
                >
                  Backend
                </motion.h3>

                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="text-2xl md:text-2xl font-bold text-foreground mb-8 pb-2 border-b-4 border-purple-600"
                >
                  <ul>
                    <li>Node.js, Express.js</li>
                    <li>Strapi, Wordpress, Moodle</li>
                    <li>.NET Framework, C#</li>
                    <li>ASP.NET Web Forms, ASP.NET MVC</li>
                  </ul>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* skill 4 */}
        <div className="sticky top-0 h-screen overflow-visible">
          <motion.div
            className="absolute inset-0 will-change-transform"
            style={{
              y: s4,
              opacity: opacity4,
              zIndex: 5,
              backgroundColor: "rgba(255, 255, 255)",
            }}
          >
            {/* Imagen de fondo */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('${Img3.src}')`,
                opacity: 0.4,
              }}
            ></div>

            {/* Contenido */}
            <div className="relative z-10 flex h-full items-center justify-center text-center pointer-events-none">
              <div className="max-w-3xl px-6 pointer-events-auto">
                <motion.h3
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="text-4xl lg:text-6xl font-extrabold text-primary mb-4"
                >
                  Databases
                </motion.h3>

                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="text-2xl md:text-2xl font-bold text-foreground mb-8 pb-2 border-b-4 border-purple-600"
                >
                  <ul>
                    <li>PostgreSQL</li>
                    <li>SQL Server</li>
                    <li>Reporting Services</li>
                    <li>Google Cloud SQL</li>
                  </ul>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* skill 5 */}
        <div className="sticky top-0 h-screen overflow-visible">
          <motion.div
            className="absolute inset-0 will-change-transform"
            style={{
              y: s5,
              opacity: opacity5,
              zIndex: 6,
              backgroundColor: "rgba(255, 255, 255)",
            }}
          >
            {/* Imagen de fondo */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('${Img4.src}')`,
                opacity: 0.4,
              }}
            ></div>

            {/* Contenido */}
            <div className="relative z-10 flex h-full items-center justify-center text-center pointer-events-none">
              <div className="max-w-3xl px-6 pointer-events-auto">
                <motion.h3
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="text-4xl lg:text-6xl font-extrabold text-primary mb-4"
                >
                  {t("portfolio.skills.t2")}
                </motion.h3>

                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="text-2xl md:text-2xl font-bold text-foreground mb-8 pb-2 border-b-4 border-purple-600"
                >
                  <ul>
                    <li>Git</li>
                    <li>Vercel</li>
                    <li>Visual Studio Code</li>
                    <li>GameMaker</li>
                    <li>Storyline 360</li>
                    <li>Reporting Services</li>
                    <li>Google Cloud Platform</li>
                    <li>AI Integration</li>
                    <li>Data Analysis</li>
                    <li>Moodle Support</li>
                    <li>Agile Methologies</li>
                  </ul>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* EDUCATION SECTION */}
      <EducationComponent />

      {/* CONTACT SECTION */}
      <ContactComponent />

      <footer className="grid grid-cols-1 lg:grid-cols-3 bg-gray-700 text-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 pt-4 text-start">
          {t("portfolio.footer.t1")}
        </div>
        <div className="max-w-7xl mx-auto px-4 pt-4 text-center"></div>
        <div className="max-w-7xl mx-auto px-4 pt-4 lg:text-end">
          {t("portfolio.footer.t2")}
        </div>
      </footer>
    </div>
  );
}
