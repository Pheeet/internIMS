import InternshipsClient from "./InternshipsClient";
import { prisma } from "@/lib/prisma";

export default async function AdminInternshipsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: defaultStatus } = await searchParams;
  const internships = await prisma.internship.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      position: true,
      status: true,
      department: true,
      company: true,
      supervisorName: true,
      startDate: true,
      endDate: true,
      remarks: true,
      createdAt: true,
      flaggedFields: true,
      previousSnapshot: true,
      attachments: {
        select: {
          id: true,
          fileName: true,
          fileUrl: true,
          fileType: true,
          status: true,
          rejectReason: true,
        },
      },
      student: {
        select: {
          id: true,
          email: true,
          studentProfile: {
            select: {
              profilePictureUrl: true,
              prefix: true,
              firstNameTh: true,
              lastNameTh: true,
              gender: true,
              dob: true,
              phoneNumber: true,
              emergencyPhone: true,
              contactAddress: true,
              guardianName: true,
              guardianRelationship: true,
              educationLevel: true,
              institution: true,
              faculty: true,
              major: true,
              advisorName: true,
              advisorPhone: true,
            },
          },
        },
      },
    },
  });

  const applications = internships.map((item) => ({
    id: item.id,
    position: item.position,
    department: item.department,
    company: item.company,
    departmentUnit: item.company ?? item.department ?? "-",
    internshipStatus: item.status,
    createdAt: item.createdAt.toISOString(),
    startDate: item.startDate ? item.startDate.toISOString() : null,
    endDate: item.endDate ? item.endDate.toISOString() : null,
    remarks: item.remarks,
    supervisorName: item.supervisorName,
    profile: {
      userId: item.student.id,
      email: item.student.email,
      profilePictureUrl: item.student.studentProfile?.profilePictureUrl ?? null,
      prefix: item.student.studentProfile?.prefix ?? "",
      firstName: item.student.studentProfile?.firstNameTh ?? "ไม่ระบุ",
      lastName: item.student.studentProfile?.lastNameTh ?? "",
      gender: item.student.studentProfile?.gender ?? null,
      dob: item.student.studentProfile?.dob ? item.student.studentProfile.dob.toISOString() : null,
      phoneNumber: item.student.studentProfile?.phoneNumber ?? null,
      emergencyPhone: item.student.studentProfile?.emergencyPhone ?? null,
      contactAddress: item.student.studentProfile?.contactAddress ?? null,
      guardianName: item.student.studentProfile?.guardianName ?? null,
      guardianRelationship: item.student.studentProfile?.guardianRelationship ?? null,
      educationLevel: item.student.studentProfile?.educationLevel ?? "-",
      institution: item.student.studentProfile?.institution ?? "-",
      faculty: item.student.studentProfile?.faculty ?? "-",
      major: item.student.studentProfile?.major ?? "-",
      advisorName: item.student.studentProfile?.advisorName ?? null,
      advisorPhone: item.student.studentProfile?.advisorPhone ?? null,
    },
    attachments: item.attachments,
    flaggedFields: (item.flaggedFields ?? null) as Record<string, { flagged: boolean; reason: string }> | null,
    previousSnapshot: (item.previousSnapshot ?? null) as Record<string, string | null | undefined> | null,
  }));

  return (
    <div className="w-full h-full bg-[#f8f9fa] min-h-[90vh]">
      <InternshipsClient applications={applications} defaultStatus={defaultStatus} />
    </div>
  );
}
