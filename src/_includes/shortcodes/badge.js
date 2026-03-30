/**
 *@param {string} name
 *@param {string} iconName
 *@param {string} link
 *@return {string}
 */
const badge = (name, iconName, link) => {
  var icon, iconAndText, contentWithLink;

  if (iconName == "arrow-back") {
    icon = `
    <svg class="self-center" width="24px" height="24px" viewBox="0 0 512 512">
      <title>Arrow Back</title>
      <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M244 400 100 256l144-144M120 256h292"/>
    </svg>`;
  }

  if (iconName == "arrow-forward") {
    icon = `
    <svg class="ionicon" width="24px" height="24px" viewBox="0 0 512 512">
      <title>Arrow Forward</title>
      <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="m268 112 144 144-144 144m124-144H100"/>
    </svg>`;
  }

  if (iconName == "menu") {
    icon = `
    <svg class="self-center" width="24px" height="24px" viewBox="0 0 512 512">
      <title>Menu</title>
      <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="48" d="M88 152h336M88 256h336M88 360h336"/>
    </svg>`;
  }

  iconAndText = `
    <div class="mr-2">
      ${icon}
    </div>
    <div>
      <span class="select-none pt-1 pl-1 text-xl font-regular">
        ${name}
      </span>
    </div>
  `;

  if (iconName == "arrow-forward") {
    iconAndText = `
    <div>
      <span class="select-none pl-2 text-xl font-regular">
        ${name}
      </span>
    </div>
    <div class="mr-2 pl-1">
      ${icon}
    </div>
  `;
  }

  const wrapper = (content) => {
    return `
    <div class="inline-flex items-center badge font-medium text-gray-500">
      ${content}
    </div>
    `;
  };

  if (link == null) {
    return wrapper(iconAndText);
  }

  contentWithLink = `
    <a aria-label="back" href="${link}" class="flex no-underline hover:hover-link items-center">
      ${iconAndText}
    </a>
  `;

  return wrapper(contentWithLink);
};

export default badge;
