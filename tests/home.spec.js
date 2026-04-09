import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

async function gotoHome(page) {
    await page.goto(BASE_URL);
    await page.waitForSelector("h1", { state: "visible", timeout: 15_000 });
}

// ---------------------------------------------------------------------------
// 1. Page load – static content
// ---------------------------------------------------------------------------

test.describe("Page load", () => {
    test("shows hero heading, section headings, and Waiting status badge", async ({ page }) => {
        await gotoHome(page);
        await expect(page.getByRole("heading", { level: 1 })).toContainText(
            "Upload your resume, paste the role, and get honest feedback",
        );
        await expect(page.getByRole("heading", { name: "Load the resume and target role" })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Review the extracted resume text" })).toBeVisible();
        await expect(page.getByText("Waiting")).toBeVisible();
    });

    test("shows the three info tiles", async ({ page }) => {
        await gotoHome(page);
        await expect(page.getByText("PDF or DOCX plus a pasted job description.")).toBeVisible();
        await expect(
            page.getByText("The prompt tells the model not to invent experience, metrics, or skills."),
        ).toBeVisible();
        await expect(
            page.getByText("Summary, fit assessment, strengths, weaknesses, and improvements."),
        ).toBeVisible();
    });

    test("shows results placeholder before any analysis", async ({ page }) => {
        await gotoHome(page);
        await expect(
            page.getByText("Extract the resume text, confirm it, and the LLM analysis will appear here."),
        ).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// 2. Default button and input states
// ---------------------------------------------------------------------------

test.describe("Default states", () => {
    test("all form inputs start empty", async ({ page }) => {
        await gotoHome(page);
        await expect(page.getByPlaceholder("Security analyst")).toHaveValue("");
        await expect(page.getByRole("combobox")).toHaveValue("");
        await expect(
            page.getByPlaceholder("Paste the responsibilities and qualifications here."),
        ).toHaveValue("");
    });

    test("Extract is enabled; Run LLM Analysis, Download, and Clear are disabled", async ({ page }) => {
        await gotoHome(page);
        await expect(page.getByRole("button", { name: "Extract Resume Text" })).toBeEnabled();
        await expect(page.getByRole("button", { name: "Run LLM Analysis" })).toBeDisabled();
        await expect(page.getByRole("button", { name: "Download Session File" })).toBeDisabled();
        await expect(page.getByRole("button", { name: "Clear Saved Draft" })).toBeDisabled();
    });
});

// ---------------------------------------------------------------------------
// 3. Form interactions – real user behaviour
// ---------------------------------------------------------------------------

test.describe("Form interactions", () => {
    test("user can type into the target role field", async ({ page }) => {
        await gotoHome(page);
        const input = page.getByPlaceholder("Security analyst");
        await input.click();
        await input.fill("Data Engineer");
        await expect(input).toHaveValue("Data Engineer");
    });

    test("user can type into the job description field", async ({ page }) => {
        await gotoHome(page);
        const textarea = page.getByPlaceholder("Paste the responsibilities and qualifications here.");
        await textarea.click();
        await textarea.fill("We need a Python expert with 5 years of experience.");
        await expect(textarea).toHaveValue("We need a Python expert with 5 years of experience.");
    });

    test("user can select every seniority level", async ({ page }) => {
        await gotoHome(page);
        const select = page.getByRole("combobox");
        for (const level of ["Entry level", "Mid level", "Senior"]) {
            await select.selectOption(level);
            await expect(select).toHaveValue(level);
        }
        await select.selectOption("");
        await expect(select).toHaveValue("");
    });

    test("user can type resume text directly into the confirmation textarea", async ({ page }) => {
        await gotoHome(page);
        const textarea = page.getByPlaceholder(
            "After extraction, the resume text will appear here. You can correct section headings or paste plain text if parsing missed something.",
        );
        await textarea.click();
        await textarea.fill("Jane Doe — Senior Software Engineer. 5 years of Python.");
        await expect(textarea).toHaveValue("Jane Doe — Senior Software Engineer. 5 years of Python.");
    });

    // Meaningful E2E scenario: user fills in all fields across the form
    // and confirms each field holds the correct value before submitting.
    test("user fills all fields and the form reflects a complete ready state", async ({ page }) => {
        await gotoHome(page);

        const roleInput = page.getByPlaceholder("Security analyst");
        const jdTextarea = page.getByPlaceholder("Paste the responsibilities and qualifications here.");
        const resumeTextarea = page.getByPlaceholder(
            "After extraction, the resume text will appear here. You can correct section headings or paste plain text if parsing missed something.",
        );

        await roleInput.click();
        await roleInput.fill("DevOps Engineer");

        await jdTextarea.click();
        await jdTextarea.fill("Looking for a DevOps engineer with CI/CD experience.");

        await page.getByRole("combobox").selectOption("Senior");

        await resumeTextarea.click();
        await resumeTextarea.fill("Jane Doe. 8 years of DevOps. Kubernetes, Terraform, GitHub Actions.");

        // All fields hold their values
        await expect(roleInput).toHaveValue("DevOps Engineer");
        await expect(jdTextarea).toHaveValue("Looking for a DevOps engineer with CI/CD experience.");
        await expect(page.getByRole("combobox")).toHaveValue("Senior");
        await expect(resumeTextarea).toHaveValue(
            "Jane Doe. 8 years of DevOps. Kubernetes, Terraform, GitHub Actions.",
        );
    });
});