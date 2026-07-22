import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { validateOnePagerSvg } from "../dist/brand.js";

const root = resolve(import.meta.dirname, "..");
const outputDir = resolve(root, "outputs/one-pager-short-term-rentals");
const imagePath = resolve(outputDir, "central-building.png");

const [building, logoSource] = await Promise.all([
  readFile(imagePath),
  readFile(resolve(root, "assets/logos/ccc-wide-orange.svg"), "utf8"),
]);

const b64 = (buffer) => buffer.toString("base64");
const inlineLogo = logoSource
  .replace(/^.*?<svg[^>]*>/s, "")
  .replace(/<\/svg>\s*$/s, "")
  .replace(/<defs>.*?<\/defs>/s, "")
  .replaceAll('class="cls-1"', 'fill="#E95C1F"');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1"
  width="1186.51" height="1535.49" viewBox="0 0 1186.51 1535.49"
  data-ccc-asset="one-pager" data-ccc-layout-lock="one-pager-reference-exact"
  data-ccc-one-pager-template="access_barriers" data-ccc-export="illustrator-svg-1.1"
  data-ccc-font-policy="editable-installed" data-ccc-typography-contract="access_barriers-reference"
  data-ccc-component-grid="reference-spaced" data-ccc-arrow-system="explicit-shaft-arrowhead">
  <title>Why a short stay is getting harder to find in Europe</title>
  <desc>Consumer Choice Center one-pager on European short-term rental registration, restrictions, permits, competition, and consumer choice.</desc>
  <defs>
    <style><![CDATA[
      .label{font-family:'DM Mono';font-size:26.98px;letter-spacing:.25px;fill:#FFF7EF}
      .callout-title{font-family:'Montserrat';font-size:16.83px;font-weight:700;font-style:italic;fill:#FFF7EF}
      .callout-copy{font-family:'Montserrat';font-size:15.53px;font-weight:600;fill:#FFF7EF}
      .card-number{font-family:'Anton';font-size:55.62px;fill:#E95C1F}
      .card-copy{font-family:'Montserrat';font-size:15.53px;font-weight:600;fill:#15192E}
      .small{font-family:'Montserrat';font-size:12px;font-weight:400;fill:#15192E}
    ]]></style>
    <linearGradient id="faded-mark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#22274E" stop-opacity="0.75"/>
      <stop offset="1" stop-color="#E95C1F" stop-opacity="0.13"/>
    </linearGradient>
  </defs>
  <metadata data-ccc-font-policy="editable-installed" data-ccc-required-fonts="Anton, Montserrat, DM Mono">Install the packaged CCC fonts before editing in Adobe Illustrator. Text remains editable and no browser-style web fonts are embedded.</metadata>

  <rect width="1186.51" height="1010" fill="#15192E"/>
  <rect y="1010" width="1186.51" height="525.49" fill="#FFF7EF"/>
  <path d="M514.19,374.8a135.7,135.7,0,0,1-9.67,9.68A145,145,0,0,1,309,384.2a133.65,133.65,0,0,1-9.68-9.67,145.1,145.1,0,0,1,0-195.27,133.86,133.86,0,0,1,9.68-9.68l9.67,9.68a135.72,135.72,0,0,0-9.67,9.67,131.09,131.09,0,0,0,0,175.87,135.63,135.63,0,0,0,9.67,9.67,130.88,130.88,0,0,0,176.14.33l-18.36-18.37a105,105,0,0,1-139.41,0,89.17,89.17,0,0,1-9.67-9.67,105.12,105.12,0,0,1,.32-139.08,90.18,90.18,0,0,1,9.68-9.67,105.1,105.1,0,0,1,139.08-.33,68,68,0,0,1,9.67,9.67L476.42,217l-36.14,36.14a44.88,44.88,0,0,0-9.68-9.68,40.21,40.21,0,0,0-23.89-7.43,40.77,40.77,0,0,0-23.89,7.76,45.24,45.24,0,0,0-9.67,9.67,41.48,41.48,0,0,0-7.76,23.89,43.67,43.67,0,0,0,7.43,23.89A38.71,38.71,0,0,0,382.5,311l-9.68,9.68a68.13,68.13,0,0,1-9.68-9.68,55.48,55.48,0,0,1-11.31-33.57,53.72,53.72,0,0,1,11.59-33.56,67.54,67.54,0,0,1,9.67-9.68,54.92,54.92,0,0,1,67.14-.27l26.45-26.46a92,92,0,0,0-120,0,67.54,67.54,0,0,0-9.67,9.68,92,92,0,0,0,0,120,68,68,0,0,0,9.67,9.67,92,92,0,0,0,120.38.33,67.1,67.1,0,0,0,9.68-9.68l9.68,9.68,18.36,18.37Z"
    fill="url(#faded-mark)" opacity="0.42" transform="translate(-510 95) scale(2.14)"/>

  <g data-ccc-role="one-pager-logo" transform="translate(945 42) scale(.78)">${inlineLogo}</g>

  <g data-ccc-role="one-pager-title">
    <g data-ccc-component="title-kicker" data-ccc-bounds="38 42 680 45" data-ccc-text-inset="1 3 38 3" data-ccc-text-safe-box="39 45 640 27">
      <text x="39" y="68" class="label" data-ccc-type-role="page-kicker" font-family="DM Mono" font-size="26.98" font-weight="400">CONSUMER CHOICE CENTER | POLICY GRAPHIC</text>
      <rect x="39" y="82" width="68" height="7" fill="#E95C1F"/>
    </g>
    <g data-ccc-component="title-copy" data-ccc-bounds="38 111 540 551" data-ccc-text-inset="1 4 30 4" data-ccc-text-safe-box="39 115 508 543">
    <text x="38" y="165" data-ccc-type-role="display-title" font-family="Anton" font-size="95.97" font-weight="400" fill="#FFF7EF" letter-spacing="-.5">
      <tspan x="38" dy="0">WHY</tspan>
      <tspan x="38" dy="105" fill="#E95C1F">SHORT STAYS</tspan>
      <tspan x="38" dy="105" fill="#FFF7EF">ARE HARDER</tspan>
      <tspan x="38" dy="105">TO FIND</tspan>
      <tspan x="38" dy="105">IN EUROPE</tspan>
    </text>
    <path d="M38 600 C180 590 335 609 502 596" fill="none" stroke="#E95C1F" stroke-width="13" stroke-linecap="round"/>
    <text x="40" y="632" font-family="Montserrat" font-size="20" font-weight="500" fill="#FFF7EF">
      <tspan x="40">Fragmented rules can reduce accommodation choice</tspan>
      <tspan x="40" dy="25">and push up prices for European travellers.</tspan>
    </text>
    </g>
  </g>

  <g data-ccc-role="one-pager-central-illustration" data-ccc-component="central-object" data-ccc-bounds="605 122 350 638" data-ccc-text-inset="0 0 0 0">
    <path d="M619 711 C695 744 866 748 955 706 L952 735 C850 775 687 770 610 736 Z" fill="#22264E" opacity="0.62"/>
    <image x="605" y="122" width="350" height="638" preserveAspectRatio="xMidYMid meet"
      xlink:href="data:image/png;base64,${b64(building)}"/>
  </g>

  <g data-ccc-role="one-pager-callouts">
    <g data-ccc-component="callout-registration" data-ccc-bounds="360 690 220 106" data-ccc-text-inset="12 8 10 6" data-ccc-text-safe-box="370 698 200 94">
    <path d="M360 696 L575 690 L580 746 L365 752 Z" fill="#E95C1F"/>
    <g transform="translate(372 698)">
      <path d="M0 8h30v31H0zM6 2h18v9H6zM6 18h18M6 25h15M6 32h12" fill="none" stroke="#FFF7EF" stroke-width="3"/>
      <text x="48" y="18" class="callout-title" data-ccc-type-role="callout-title" font-family="Montserrat" font-size="16.83" font-weight="700" font-style="italic">FRAGMENTED</text>
      <text x="48" y="40" class="callout-title" data-ccc-type-role="callout-title" font-family="Montserrat" font-size="16.83" font-weight="700" font-style="italic">REGISTRATION</text>
    </g>
    <text x="370" y="774" class="callout-copy" data-ccc-type-role="callout-body" font-family="Montserrat" font-size="15.53" font-weight="600"><tspan x="370">Repeated forms and checks</tspan><tspan x="370" dy="18">raise costs for ordinary hosts.</tspan></text>
    </g>
    <g data-ccc-connector="shaft-arrowhead">
      <path d="M588 722 C616 716 640 692 657 659" fill="none" stroke="#FFF7EF" stroke-width="3" stroke-dasharray="6 7" stroke-linecap="round" stroke-linejoin="round"/>
      <polygon points="657,659 648,666 660,672" fill="#FFF7EF"/>
      <polygon points="588,722 599,714 601,727" fill="#FFF7EF"/>
    </g>

    <g data-ccc-component="callout-local-rules" data-ccc-bounds="980 199 200 125" data-ccc-text-inset="10 10 8 10" data-ccc-text-safe-box="985 209 190 111">
    <path d="M980 210 L1180 199 L1174 260 L986 270 Z" fill="#E95C1F"/>
    <g transform="translate(990 218)">
      <path d="M12 0c-8 0-14 6-14 14 0 11 14 27 14 27s14-16 14-27C26 6 20 0 12 0zm0 9a5 5 0 110 10 5 5 0 010-10z" fill="#FFF7EF"/>
      <text x="48" y="18" class="callout-title" data-ccc-type-role="callout-title" font-family="Montserrat" font-size="16.83" font-weight="700" font-style="italic">LOCAL CAPS &amp;</text>
      <text x="48" y="40" class="callout-title" data-ccc-type-role="callout-title" font-family="Montserrat" font-size="16.83" font-weight="700" font-style="italic">RESTRICTIONS</text>
    </g>
    <text x="985" y="296" class="callout-copy" data-ccc-type-role="callout-body" font-family="Montserrat" font-size="15.53" font-weight="600"><tspan x="985">Night limits and zoning</tspan><tspan x="985" dy="18">can remove legal stays.</tspan></text>
    </g>
    <g data-ccc-connector="shaft-arrowhead">
      <path d="M973 327 C958 340 948 360 942 380" fill="none" stroke="#E95C1F" stroke-width="3" stroke-dasharray="6 7" stroke-linecap="round" stroke-linejoin="round"/>
      <polygon points="942,380 941,367 953,374" fill="#E95C1F"/>
      <polygon points="973,327 961,332 969,340" fill="#E95C1F"/>
    </g>

    <g data-ccc-component="callout-permits" data-ccc-bounds="980 495 200 145" data-ccc-text-inset="10 10 8 10" data-ccc-text-safe-box="985 505 190 131">
    <path d="M985 504 L1175 495 L1180 555 L980 563 Z" fill="#E95C1F"/>
    <g transform="translate(990 513)">
      <path d="M0 1h32v39H0zM6 10h20M6 18h20M6 27h9M20 28l5 5 10-13" fill="none" stroke="#FFF7EF" stroke-width="3"/>
      <text x="48" y="18" class="callout-title" data-ccc-type-role="callout-title" font-family="Montserrat" font-size="16.83" font-weight="700" font-style="italic">PERMITS &amp;</text>
      <text x="48" y="40" class="callout-title" data-ccc-type-role="callout-title" font-family="Montserrat" font-size="16.83" font-weight="700" font-style="italic">ENFORCEMENT</text>
    </g>
    <text x="985" y="589" class="callout-copy" data-ccc-type-role="callout-body" font-family="Montserrat" font-size="15.53" font-weight="600"><tspan x="985">Target unlawful</tspan><tspan x="985" dy="18">operators—not every</tspan><tspan x="985" dy="18">ordinary host.</tspan></text>
    </g>
    <g data-ccc-connector="shaft-arrowhead">
      <path d="M973 648 C960 655 951 665 943 677" fill="none" stroke="#E95C1F" stroke-width="3" stroke-dasharray="6 7" stroke-linecap="round" stroke-linejoin="round"/>
      <polygon points="943,677 945,664 956,672" fill="#E95C1F"/>
      <polygon points="973,648 961,649 967,660" fill="#E95C1F"/>
    </g>
  </g>

  <g data-ccc-role="one-pager-lead-stat" data-ccc-component="lead-stat" data-ccc-bounds="25 820 592 112" data-ccc-text-inset="30 18 22 16" data-ccc-text-safe-box="55 838 532 90">
    <path d="M25 830 L598 820 L617 922 L38 932 Z" fill="#E95C1F"/>
    <text x="55" y="876" data-ccc-type-role="lead-stat" font-family="Anton" font-size="64" font-weight="400" fill="#FFF7EF">20 MAY 2026</text>
    <text x="57" y="901" font-family="Montserrat" font-size="17" font-weight="700" fill="#FFF7EF">EU SHORT-TERM RENTAL DATA RULES APPLY</text>
    <text x="57" y="922" font-family="Montserrat" font-size="15" font-weight="500" fill="#FFF7EF">Transparency must not become 27 administrative mazes.</text>
  </g>

  <g data-ccc-component="bridge-statement" data-ccc-bounds="651 820 499 112" data-ccc-text-inset="34 16 28 16" data-ccc-text-safe-box="685 836 437 88">
    <path d="M651 828 L1150 820 L1141 924 L663 932 Z" fill="#22264E" stroke="#E95C1F" stroke-width="3"/>
    <text x="685" y="860" font-family="Montserrat" font-size="22" font-weight="700" font-style="italic" fill="#FFF7EF">TRANSPARENCY SHOULD MAKE</text>
    <text x="685" y="889" font-family="Montserrat" font-size="22" font-weight="700" font-style="italic" fill="#FFF7EF">SHORT-TERM RENTALS SAFER—</text>
    <text x="685" y="918" font-family="Montserrat" font-size="22" font-weight="700" font-style="italic" fill="#E95C1F">NOT MAKE THEM DISAPPEAR.</text>
  </g>

  <g data-ccc-component="section-banner" data-ccc-bounds="0 962 1186.51 56" data-ccc-text-inset="54 10 40 8" data-ccc-text-safe-box="54 972 1092 38">
  <path d="M0 970 L1186.51 962 L1186.51 1018 L0 1010 Z" fill="#E95C1F"/>
  <text x="54" y="1005" data-ccc-type-role="section-heading" font-family="Montserrat" font-size="35.84" font-weight="800" font-style="italic" fill="#FFF7EF">CHOICE, COMPETITION &amp; BETTER STAYS</text>
  </g>

  <g data-ccc-role="one-pager-evidence-cards">
    <g transform="translate(42 1056)" data-ccc-component="evidence-card-1" data-ccc-bounds="42 1056 248 252" data-ccc-text-inset="21 30 20 20" data-ccc-text-safe-box="63 1086 207 202">
      <path d="M0 8 L238 0 L248 246 L9 252 Z" fill="#FFFFFF" stroke="#15192E" stroke-width="2"/>
      <text x="21" y="63" class="card-number" data-ccc-type-role="evidence-number" font-family="Anton" font-size="55.62" font-weight="400">854.1M</text>
      <text x="22" y="95" class="card-copy" data-ccc-type-role="evidence-body" font-family="Montserrat" font-size="15.53" font-weight="600"><tspan x="22">GUEST NIGHTS BOOKED</tspan><tspan x="22" dy="20">VIA MAJOR PLATFORMS</tspan><tspan x="22" dy="20">IN THE EU IN 2024</tspan></text>
      <path d="M22 171h176" stroke="#E95C1F" stroke-width="6"/>
      <text x="22" y="205" font-family="Anton" font-size="27" fill="#15192E">+18.8%</text>
      <text x="113" y="204" class="small">vs. 2023</text>
      <text x="22" y="231" class="small">EUROSTAT PLATFORM DATA</text>
    </g>
    <g transform="translate(315 1056)" data-ccc-component="evidence-card-2" data-ccc-bounds="315 1056 240 252" data-ccc-text-inset="21 30 20 20" data-ccc-text-safe-box="336 1086 199 202">
      <path d="M0 0 L240 8 L235 252 L7 245 Z" fill="#FFFFFF" stroke="#15192E" stroke-width="2"/>
      <text x="21" y="63" class="card-number" data-ccc-type-role="evidence-number" font-family="Anton" font-size="55.62" font-weight="400">2.3M</text>
      <text x="22" y="95" class="card-copy" data-ccc-type-role="evidence-body" font-family="Montserrat" font-size="15.53" font-weight="600"><tspan x="22">TRAVELLERS PER NIGHT</tspan><tspan x="22" dy="20">USED PLATFORM-BOOKED</tspan><tspan x="22" dy="20">STAYS IN 2024</tspan></text>
      <path d="M22 171h176" stroke="#E95C1F" stroke-width="6"/>
      <text x="22" y="204" class="small"><tspan x="22">Choice is not marginal:</tspan><tspan x="22" dy="19">it is how millions travel.</tspan></text>
    </g>
    <g transform="translate(584 1056)" data-ccc-component="evidence-card-3" data-ccc-bounds="584 1056 244 253" data-ccc-text-inset="22 30 20 20" data-ccc-text-safe-box="606 1086 202 203">
      <path d="M5 5 L244 0 L235 249 L0 253 Z" fill="#FFFFFF" stroke="#15192E" stroke-width="2"/>
      <text x="22" y="63" class="card-number" data-ccc-type-role="evidence-number" font-family="Anton" font-size="55.62" font-weight="400">27</text>
      <text x="22" y="95" class="card-copy" data-ccc-type-role="evidence-body" font-family="Montserrat" font-size="15.53" font-weight="600"><tspan x="22">MEMBER STATES</tspan><tspan x="22" dy="20">SHOULD NOT BECOME</tspan><tspan x="22" dy="20">27 BARRIERS</tspan></text>
      <path d="M22 171h176" stroke="#E95C1F" stroke-width="6"/>
      <text x="22" y="204" class="small"><tspan x="22">One EU data framework;</tspan><tspan x="22" dy="19">consistent implementation.</tspan></text>
    </g>

    <g transform="translate(854 1064)" data-ccc-component="evidence-donuts" data-ccc-bounds="854 1064 300 190" data-ccc-text-inset="0 0 0 0">
      <text x="0" y="18" font-family="DM Mono" font-size="13" fill="#15192E">2024 EU TOURIST NIGHTS</text>
      <g transform="translate(11 40)">
        <circle cx="78" cy="78" r="62" fill="none" stroke="#E7ECF4" stroke-width="23"/>
        <circle cx="78" cy="78" r="62" fill="none" stroke="#E95C1F" stroke-width="23" stroke-dasharray="245 390" transform="rotate(-90 78 78)"/>
        <text x="78" y="72" text-anchor="middle" font-family="Anton" font-size="38" fill="#15192E">63%</text>
        <text x="78" y="96" text-anchor="middle" class="small">HOTELS</text>
      </g>
      <g transform="translate(157 40)">
        <circle cx="78" cy="78" r="62" fill="none" stroke="#E7ECF4" stroke-width="23"/>
        <circle cx="78" cy="78" r="62" fill="none" stroke="#22264E" stroke-width="23" stroke-dasharray="94 390" transform="rotate(-90 78 78)"/>
        <text x="78" y="72" text-anchor="middle" font-family="Anton" font-size="38" fill="#15192E">24%</text>
        <text x="78" y="94" text-anchor="middle" font-family="Montserrat" font-size="10" font-weight="700" fill="#15192E">HOLIDAY &amp;</text>
        <text x="78" y="108" text-anchor="middle" font-family="Montserrat" font-size="10" font-weight="700" fill="#15192E">SHORT STAYS</text>
      </g>
    </g>
  </g>

  <g data-ccc-role="one-pager-takeaway" data-ccc-component="takeaway" data-ccc-bounds="42 1335 1104 135" data-ccc-text-inset="36 42 36 18" data-ccc-text-safe-box="78 1353 1032 99">
    <path d="M42 1343 L1146 1335 L1138 1462 L50 1470 Z" fill="#15192E"/>
    <text x="78" y="1385" data-ccc-type-role="takeaway-heading" font-family="Montserrat" font-size="27.92" font-weight="700" fill="#FFF7EF">TARGET UNLAWFUL OPERATORS—</text>
    <text x="78" y="1420" data-ccc-type-role="takeaway-heading" font-family="Montserrat" font-size="27.92" font-weight="700" fill="#E95C1F">NOT ORDINARY HOSTS OR TRAVELLERS’ CHOICES.</text>
    <text x="79" y="1452" data-ccc-type-role="takeaway-body" font-family="Montserrat" font-size="16" font-weight="400" fill="#FFF7EF">Let hotels, apartments, guesthouses and home-sharing compete for consumers.</text>
  </g>

  <g data-ccc-role="one-pager-sources" data-ccc-component="sources" data-ccc-bounds="45 1495 1095 25" data-ccc-text-inset="0 10 0 0" data-ccc-text-safe-box="45 1500 1095 18">
    <text x="45" y="1510" data-ccc-type-role="source" font-family="DM Mono" font-size="10.5" font-weight="400" fill="#15192E">SOURCES: REGULATION (EU) 2024/1028 • EUROSTAT, PLATFORM TOURISM DATA (2024) • EUROSTAT, TOURISM NIGHTS (2024)</text>
    <text x="1140" y="1510" text-anchor="end" data-ccc-type-role="source" font-family="DM Mono" font-size="10.5" font-weight="400" fill="#E95C1F">CONSUMERCHOICECENTER.ORG</text>
  </g>
</svg>`;

await mkdir(outputDir, { recursive: true });
const svgPath = resolve(outputDir, "short-term-rentals-europe.svg");
const validation = validateOnePagerSvg({ svg, template: "access_barriers", mode: "final" });
if (!validation.ok) throw new Error(validation.violations.join("\n"));
await writeFile(svgPath, svg, "utf8");
await writeFile(resolve(outputDir, "short-term-rentals-europe.validation.json"), `${JSON.stringify(validation, null, 2)}\n`, "utf8");
console.log(`Created ${svgPath}`);
