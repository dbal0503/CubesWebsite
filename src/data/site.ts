/**
 * Site-wide settings. `null` means not provided yet: the UI hides that link
 * instead of shipping a dead one.
 */
export const site = {
  name: "CUBES",
  fullName: "Concordia University Building Engineering Society",
  description:
    "CUBES represents Concordia's undergraduate building engineering students, with events, workshops and industry connections that go beyond the classroom.",
  office: "MU403, 2170 Bishop St., Montreal",
  socials: {
    instagram: "https://www.instagram.com/cubes.eca/",
    facebook: "https://www.facebook.com/CUBES.eca/",
    linkedin: null as string | null,
    tiktok: null as string | null,
  },
  signupUrl: null as string | null,
  contactEmail: "president.cubes@ecaconcordia.ca",
  merch: {
    zeffyUrl:
      "https://www.zeffy.com/en-CA/ticketing/cubes-building-engineering-student-merch-fall--2026",
    pickup: "2170 Bishop St., Suite 403, Montreal, QC H3G 2E9",
  },
};

export type SocialKey = keyof typeof site.socials;
