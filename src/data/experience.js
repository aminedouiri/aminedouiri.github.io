/**
 * ✏️  YOUR EXPERIENCE — newest first.
 *
 * Each entry becomes one stop on the road (a 3D cube + the info panel).
 *   kind        optional label, e.g. "Education" (shown instead of "stop 02")
 *   title       first part of the job title (white)
 *   titleAccent second part of the job title (blue)
 *   facts       three [value, label] pairs shown on the "Impact" tab
 *   stack       tools used in this role (also links the role to the tech landmarks)
 */
export const jobs = [
  {
    start: "[2024]",
    end: "Now",
    title: "[DevOps]",
    titleAccent: "Engineer",
    company: "[Company name]",
    place: "[City] · Full-time",
    points: [
      "[Owned the Kubernetes platform (EKS) serving N production services.]",
      "[Moved releases to GitOps with Argo CD and canary rollouts.]",
      "[Reduced cloud spend by right-sizing nodes and autoscaling.]",
    ],
    facts: [["[6 min]", "Deploy time"], ["[99.9%]", "Uptime"], ["[−30%]", "Cloud cost"]],
    stack: ["AWS", "EKS", "Terraform", "Argo CD", "Helm"],
  },
  {
    start: "[2022]",
    end: "[2024]",
    title: "[Junior DevOps]",
    titleAccent: "& SRE",
    company: "[Company name]",
    place: "[City] · Full-time",
    points: [
      "[Built CI pipelines in GitHub Actions for N repositories.]",
      "[Set up Prometheus, Grafana and on-call alert routing.]",
      "[Containerised legacy apps with Docker.]",
    ],
    facts: [["[N]", "Pipelines"], ["[2 min]", "Time to detect"], ["[N]", "Services"]],
    stack: ["Docker", "GitHub Actions", "Prometheus", "Grafana"],
  },
  {
    start: "[2020]",
    end: "[2022]",
    title: "[System]",
    titleAccent: "Administrator",
    company: "[Company name]",
    place: "[City] · Full-time",
    points: [
      "[Managed N Linux servers and the internal network.]",
      "[Automated server setup with Ansible and Bash.]",
      "[Ran backups and disaster-recovery drills.]",
    ],
    facts: [["[N]", "Servers"], ["[N h]", "Saved weekly"], ["[0]", "Data lost"]],
    stack: ["Linux", "Ansible", "Bash", "Nginx"],
  },
  {
    kind: "Education",
    start: "2017",
    end: "2022",
    title: "Master’s",
    titleAccent: "Degree",
    company: "[University name]",
    place: "[City] · [Field, e.g. Computer Science / Networks]",
    points: [
      "[Master’s in your field, e.g. Computer Science, Networks & Systems.]",
      "[Thesis / final project: title and what you built.]",
      "[Key courses: networks, Linux systems, cloud, security.]",
    ],
    facts: [["5 yrs", "2017 — 2022"], ["Master", "Level"], ["[Grade]", "Mention"]],
    stack: ["[Course 1]", "[Course 2]", "[Course 3]"],
  },
];

/** ✏️  Toolchain shown on the "Stack" stop: [category, tools]. Keep it to 6 rows. */
export const stack = [
  ["Cloud", "AWS · GCP · Azure basics"],
  ["Containers", "Docker · Kubernetes · Helm"],
  ["Infra as Code", "Terraform · Ansible · Packer"],
  ["CI / CD", "GitHub Actions · GitLab CI · Argo CD"],
  ["Observability", "Prometheus · Grafana · Loki"],
  ["Languages", "Bash · Python · Go · YAML"],
];
