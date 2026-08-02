import type { User } from "../../pages/ProfilePage";
import { ContactInformation } from "./ContactInformation";
import { AcademicInformation } from "./AcademicInformation";
import { Settings } from "./Settings";
import { UserRelations } from "./UserRelations";
import { JourneySchedule } from "./JourneySchedule";

type ProfileContentProps = {
  user: User;
  mode: "self" | "user";
  onPersonalize?: () => void;
  onChangePassword?: () => void;
  onLogout?: () => void;
};

export function ProfileContent({
  user,
  mode,
  onPersonalize,
  onChangePassword,
  onLogout,
}: ProfileContentProps) {
  return (
    <div className="grid w-full max-w-200 grid-cols-1 gap-12 md:grid-cols-[45%_55%] md:gap-24">
      <div className="flex flex-col gap-8">
        <ContactInformation
          institutionalEmail={user.institutionalEmail}
          administrativeEmail={user.administrativeEmail}
        />

        <AcademicInformation
          mode={mode}
          curriculumUrl={user.curriculumUrl}
          lattesUrl={user.lattesUrl}
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
          totalHours="25 horas"
          location={user.location}
          schedule={user.journeys}
          editable={false}
        />
      </div>
    </div>
  );
}
