/**
 * ✏️  YOUR EXPERIENCE — newest first.
 *
 * Each entry becomes one stop on the road (a 3D cube + the info panel).
 *   kind        optional label, e.g. "Education" (shown instead of "stop 02")
 *   title       first part of the job title (white)
 *   titleAccent second part of the job title (blue)
 *   points      what you did — the first three are shown on the 3D cube, all of them in the panel
 *   facts       three [value, label] pairs shown on the "Impact" tab
 *   stack       tools used in this role (also links the role to the tech landmarks)
 */
export const jobs = [
  {
    start: "Jun 2026",
    end: "Now",
    title: "DevSecOps",
    titleAccent: "Engineer",
    company: "Toot Atamwil",
    place: "Riyadh, Saudi Arabia · Full-time",
    points: [
      "Designed secure CI/CD pipelines with GitLab CI/CD and Google Cloud Build, with automated security and vulnerability scanning built into delivery.",
      "Provisioned and managed GCP infrastructure with Terraform, following Infrastructure as Code best practices.",
      "Secured containers with Docker image vulnerability scanning and secure image management in Google Artifact Registry.",
      "Configured IAM roles, service accounts and least-privilege access policies across GCP resources.",
      "Integrated SonarQube into CI/CD to catch code vulnerabilities, security hotspots and quality issues.",
      "Managed secrets and sensitive configuration with Google Secret Manager.",
      "Set up cloud security monitoring and auditing with Cloud Logging, Cloud Monitoring and Cloud Audit Logs.",
      "Applied Kubernetes security best practices: RBAC, network policies, secrets management and workload security.",
      "Automated security checks and compliance validation across the deployment lifecycle.",
    ],
    facts: [["GCP", "Cloud platform"], ["Shift-left", "Security in CI/CD"], ["Least privilege", "IAM model"]],
    stack: ["Google Cloud", "GitLab CI", "Cloud Build", "Terraform", "Docker", "Kubernetes", "SonarQube", "Secret Manager"],
  },
  {
    start: "Dec 2022",
    end: "Jun 2026",
    title: "DevOps",
    titleAccent: "Engineer",
    company: "CTC",
    place: "Algiers, Algeria · Full-time",
    points: [
      "Deployed and managed containerized applications on Kubernetes clusters in the company's on-premises VMware datacenter.",
      "Built CI/CD with GitLab CI/CD for integration and Argo CD for GitOps-based delivery and automated Kubernetes deployments.",
      "Implemented observability with OpenTelemetry, Prometheus and Grafana for real-time infrastructure and application monitoring.",
      "Built and maintained centralized logging with Fluentd, Elasticsearch and Kibana (EFK).",
      "Configured Nginx as an API gateway and Kubernetes Ingress Controller for service routing and external traffic.",
      "Managed Google Cloud Platform services, supporting hybrid cloud and on-premises environments.",
    ],
    facts: [["3.5 yrs", "Dec 2022 — Jun 2026"], ["Hybrid", "On-prem + GCP"], ["GitOps", "Delivery model"]],
    stack: ["Kubernetes", "VMware", "GitLab CI", "Argo CD", "OpenTelemetry", "Prometheus", "Grafana", "EFK", "Nginx", "Google Cloud"],
  },
  {
    start: "Jan 2022",
    end: "Nov 2022",
    title: "DevOps",
    titleAccent: "Engineer",
    company: "WeOneIT",
    place: "Kuala Lumpur, Malaysia",
    points: [
      "Implemented CI/CD pipelines with GitHub Actions for automated testing and deployment across environments.",
      "Prepared containerized development environments for developers using Docker.",
      "Implemented Kubernetes clusters for container orchestration, scaling and services in production.",
      "Configured Nginx as an API gateway and cache for frontend, mobile and backend services.",
    ],
    facts: [["11 mo", "Jan — Nov 2022"], ["Prod", "Kubernetes clusters"], ["CI/CD", "GitHub Actions"]],
    stack: ["GitHub Actions", "Docker", "Kubernetes", "Nginx"],
  },
  {
    start: "Jan 2021",
    end: "Oct 2021",
    title: "Backend",
    titleAccent: "Developer",
    company: "EarthMeta",
    place: "Hong Kong",
    points: [
      "Extended backend functionality for an existing API system.",
      "Developed geo-calculation features.",
      "Wrote technical documentation.",
    ],
    facts: [["10 mo", "Jan — Oct 2021"], ["API", "Backend"], ["Geo", "Calculations"]],
    stack: ["Backend", "API", "Documentation"],
  },
  {
    kind: "Education",
    start: "2017",
    end: "Jul 2022",
    title: "Master’s",
    titleAccent: "Degree",
    company: "Saad Dahleb University",
    place: "Algeria · Engineering",
    points: [
      "Master’s degree in engineering, Saad Dahleb University.",
      "Graduated July 2022 with a GPA of 16 out of 20.",
    ],
    facts: [["16/20", "GPA"], ["Master", "Level"], ["2022", "Graduated"]],
    stack: ["Software Engineering", "Back End", "Databases"],
  },
];

/** ✏️  Toolchain shown on the "Stack" stop: [category, tools]. Keep it to 6 rows. */
export const stack = [
  ["Cloud", "Google Cloud · Hybrid on-prem (VMware)"],
  ["Containers", "Docker · Kubernetes · Nginx Ingress"],
  ["Infra as Code", "Terraform"],
  ["CI / CD", "GitLab CI · GitHub Actions · Cloud Build · Argo CD"],
  ["Security", "SonarQube · IAM · Secret Manager · RBAC"],
  ["Observability", "OpenTelemetry · Prometheus · Grafana · EFK"],
];
