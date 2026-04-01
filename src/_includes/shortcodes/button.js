/**
 *@param {string} text
 *@param {string} link
 *@param {string} type
 *@return {string}
 */
const button = (text, link, type) => {
  const baseClass = "rounded-full px-5.5 py-3.5 text-sm font-semibold shadow-xs inline-block";
  var customClass = "text-white bg-primary-500 hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:shadow-none dark:hover:bg-primary-400 dark:focus-visible:outline-primary-500";

  if (type == "secondary") {
    customClass ="bg-white text-gray-900 inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20";
  }

  return `<a href="${link}" class="${baseClass} ${customClass}">${text}</a>`;
};

export default button;
