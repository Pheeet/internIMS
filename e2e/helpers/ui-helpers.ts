import type { Page } from "@playwright/test";
import fs from "fs";
import path from "path";

/**
 * Select a value from a Headless UI v2 Listbox by clicking the button near a label.
 * Finds the <label> element by text, navigates to its parent container, then clicks
 * the ListboxButton inside. Headless UI v2 options don't use role="option".
 */
export async function selectListbox(
  page: Page,
  labelText: string,
  value: string,
) {
  // Find the <label> element containing the text, then go to its parent div
  const label = page
    .locator("label")
    .filter({ hasText: labelText })
    .first();
  const container = label.locator("xpath=..");
  // The ListboxButton is the first button inside this container
  const button = container.locator("button").first();
  await button.click();
  await page.waitForTimeout(300);

  // Click the option by its exact text in the dropdown
  // Use the open ListboxOptions panel to scope the search
  const option = page
    .locator("[data-headlessui-state]")
    .filter({ hasText: new RegExp(`^${escapeRegex(value)}$`) })
    .first();
  if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
    await option.click();
  } else {
    // Fallback: click by text in the dropdown panel
    await page
      .getByText(value, { exact: true })
      .click();
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Fill a Headless UI Combobox (freeText mode) by typing into the input.
 */
export async function fillCombobox(
  page: Page,
  placeholder: string,
  value: string,
) {
  const input = page.locator(`input[placeholder="${placeholder}"]`);
  await input.click();
  await input.clear();
  await input.fill(value);
  // Press Tab to blur and commit the value
  await input.press("Tab");
}

/**
 * Select a date using the calendar date picker.
 * Clicks the trigger, then navigates year/month via dropdowns, then clicks the day.
 */
export async function selectDate(
  page: Page,
  triggerText: string,
  dateStr: string,
) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const day = date.getDate();

  // Click the trigger button near the label
  const trigger = page
    .locator("button")
    .filter({ hasText: new RegExp(triggerText) })
    .first();
  await trigger.click();

  // Wait for calendar popover
  await page.waitForTimeout(500);

  // react-day-picker v9 dropdown layout: first <select> is month, second is year
  // Use aria-labels to identify them correctly
  const monthSelect = page.locator('select[aria-label="Choose the Month"]');
  const yearSelect = page.locator('select[aria-label="Choose the Year"]');

  if (await yearSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
    await yearSelect.selectOption(String(year));
  }

  if (await monthSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
    await monthSelect.selectOption(String(month));
  }

  await page.waitForTimeout(200);

  // Click the day cell
  await page
    .locator("td")
    .filter({ hasText: new RegExp(`^${day}$`) })
    .first()
    .click();
}

/**
 * Generate minimal valid PDF files for testing.
 */
export function generateTestPDFs(dir: string): string[] {
  fs.mkdirSync(dir, { recursive: true });

  const names = [
    "document_1_resume.pdf",
    "document_2_transcript.pdf",
    "document_3_idcard.pdf",
    "document_4_letter.pdf",
  ];

  const files: string[] = [];
  for (const name of names) {
    const filePath = path.join(dir, name);
    const content = name.replace(".pdf", "");
    const pdf = buildMinimalPDF(content);
    fs.writeFileSync(filePath, pdf);
    files.push(filePath);
  }

  return files;
}

function buildMinimalPDF(text: string): Buffer {
  const content = `Test file: ${text}`;
  const lines = [
    "%PDF-1.4",
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj",
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << >> >>\nendobj`,
    `4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj`,
    "xref",
    "0 5",
    "0000000000 65535 f",
    "0000000009 00000 n",
    "0000000058 00000 n",
    "0000000115 00000 n",
    "0000000266 00000 n",
    "trailer\n<< /Size 5 /Root 1 0 R >>",
    "startxref",
    "0",
    "%%EOF",
  ];
  return Buffer.from(lines.join("\n"));
}

/**
 * Generate a replacement PDF for re-upload tests.
 */
export function generateReplacementPDF(dir: string): string {
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, "replacement_resume.pdf");
  fs.writeFileSync(filePath, buildMinimalPDF("replacement resume"));
  return filePath;
}
