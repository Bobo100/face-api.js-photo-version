/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",

    // // Or if using `src` directory:
    // "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    colors: {
      ...require("tailwindcss/colors"), // 使用展開運算子得到所有預設的顏色屬性
      title: "#61dafb", // 自定義 title 顏色
    },
    extend: {},
  },
  plugins: [],
};
