import { promises as fs } from "node:fs";
import path from "node:path";
import { FormActionsClientPage } from "./FormActionsClientPage";

export default async function FormActionsPage() {
  const directory = path.join(process.cwd(), "app/front-feature/react/form-actions/components");
  const [manualFormCode, actionFormCode, actionFieldsCode, sharedActionCode] = await Promise.all([
    fs.readFile(path.join(directory, "ManualProfileForm.tsx"), "utf8"),
    fs.readFile(path.join(directory, "ActionProfileForm.tsx"), "utf8"),
    fs.readFile(path.join(directory, "ActionFormFields.tsx"), "utf8"),
    fs.readFile(path.join(process.cwd(), "app/front-feature/react/form-actions/form-action.ts"), "utf8"),
  ]);
  const manualCode = `// ManualProfileForm.tsx\n${manualFormCode}\n// 공통 함수: form-action.ts\n${sharedActionCode}`;
  const actionCode = `// ActionProfileForm.tsx\n${actionFormCode}\n// 별도 파일: ActionFormFields.tsx\n${actionFieldsCode}\n// 공통 함수: form-action.ts\n${sharedActionCode}`;
  return <FormActionsClientPage manualCode={manualCode} actionCode={actionCode} />;
}
