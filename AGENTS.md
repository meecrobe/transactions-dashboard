<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Project description

However, you are the lead developer. We expect you to:

Verify all AI-generated output - AI tools can make mistakes. It's your responsibility to test and ensure the code is correct and robust.

Understand the code you submit - be prepared to explain why you chose a particular approach or design pattern, even if an AI suggested it. Always read its reasoning and make your own informed decision.
Using AI effectively is a valuable skill, and we're interested in seeing how you leverage these tools to build a better solution.
The Scenario
As a subscriber of a streaming service, I want to see a list of my transactions, so I can monitor my expenses and retry failed payments.
Core requirements
Your mission is to build a Transactions Management Dashboard, that will allow customers to manage review transaction history, download invoices and retry failed payments.
Functional Requirements
Payment History Page requirements :

Display a list of past transactions (present at least: transaction ID, amount, date and time)
Implement a "Download Invoice" button for each transaction. Since this is a mock, it should simulate a 2-second "generating PDF" state before triggering a browser download of a dummy file. Show notification when PDF was downloaded.

Batch Payment Retries. To handle past due transactions, we need a way to retry failed payments in bulk.

Ensure some past transactions in your mock data have a "Failed" status.
Add a checkbox next to each "Failed" transaction, allowing the user to select multiple rows.
Implement a "Retry Selected" button.
When clicked, the app must simulate an API call to retry each selected payment concurrently.
Each individual row must display its own independent loading state (e.g., replacing the checkbox or status with a spinner). As each concurrent API call resolves (simulate random delays between 1 and 4 seconds per row), that specific row should independently update its UI to either "Success" or back to "Failed" (simulate a 20% failure rate).
Beyond the Requirements
While the functional requirements are the baseline, we encourage you to apply the same standards of quality and thoughtfulness you would to any professional project.
Project setup

Set up a new React project using Next.js.
Please use TypeScript for this project.
Data & API simulation
You will simulate API data retrieval without relying on a real backend.
Choose any method or tool that you find appropriate for this task.
Submission guidelines

Create a public Git repository (e.g., on GitHub).
Commit your code
Include a simple README.md file with instructions on how to run the app.
Send us the link to your repository. Presentation During the technical interview, you’ll have the opportunity to present your solution. We’ll ask a few questions about your approach, and you will also be asked to make small adjustments to the logic or fix minor issues during the session. Good luck! We look forward to seeing your work.
