import type { User } from "../../pages/ProfilePage";
import { ContactInformation } from "./ContactInformation";
import { AcademicInformation } from "./AcademicInformation";
import { Settings } from "./Settings";
import { UserRelations } from "./UserRelations";
import { JourneySchedule } from "./JourneySchedule";
import type { ToastType } from "./Toast";

type ProfileContentProps = {
  user: User;
  mode: "self" | "user";
  onPersonalize?: () => void;
  onChangePassword?: () => void;
  onLogout?: () => void;
  academicLinksEditingAllowed?: boolean;
  onSaveAcademicLinks?: (curriculumUrl: string, lattesUrl: string) => Promise<boolean>;
  onToast?: (message: string, type: ToastType) => void;
};

export function ProfileContent({
  user,
  mode,
  onPersonalize,
  onChangePassword,
  onLogout,
  academicLinksEditingAllowed = false,
  onSaveAcademicLinks,
  onToast,
}: ProfileContentProps) {
  return (
    <div className="grid w-full max-w-200 grid-cols-1 gap-12 md:grid-cols-[45%_55%] md:gap-24">
      <div className="flex flex-col gap-8">
        <ContactInformation
          institutionalEmail={user.institutionalEmail}
          administrativeEmail={user.administrativeEmail}
        />

        <AcademicInformation
          curriculumUrl={user.curriculumUrl}
          lattesUrl={user.lattesUrl}
          editingAllowed={academicLinksEditingAllowed}
          onSave={onSaveAcademicLinks}
          onToast={onToast}
        />

        {mode === "self" ? (
          <Settings
            onPersonalize={onPersonalize}
            onChangePassword={onChangePassword}
            onLogout={onLogout}
          />
        ) : (
          <UserRelations
            trails={user.trails}
            documents={user.documents}
            groups={user.groups}
          />
        )}
      </div>

      <div className="flex justify-center md:justify-end">
        <JourneySchedule
          totalHours={user.totalHours ?? "-"}
          location={user.location}
          schedule={user.journeys}
          editable={false}
        />
      </div>
    </div>
  );
}
