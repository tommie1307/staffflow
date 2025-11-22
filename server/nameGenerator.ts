// Realistic first names
const FIRST_NAMES = [
  "James", "Mary", "Robert", "Patricia", "Michael", "Jennifer", "William", "Linda",
  "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah",
  "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Betty",
  "Mark", "Margaret", "Donald", "Sandra", "Steven", "Ashley", "Paul", "Kimberly",
  "Andrew", "Donna", "Joshua", "Carol", "Kenneth", "Michelle", "Kevin", "Emily",
  "Brian", "Melissa", "George", "Deborah", "Edward", "Stephanie", "Ronald", "Rebecca",
  "Anthony", "Sharon", "Frank", "Laura", "Ryan", "Cynthia", "Gary", "Kathleen",
  "Nicholas", "Amy", "Eric", "Angela", "Jonathan", "Shirley", "Stephen", "Anna",
  "Larry", "Brenda", "Justin", "Pamela", "Scott", "Emma", "Brandon", "Nicole",
  "Benjamin", "Helen", "Samuel", "Samantha", "Frank", "Katherine", "Gregory", "Christine",
  "Alexander", "Debra", "Patrick", "Rachel", "Jack", "Catherine", "Dennis", "Carolyn",
  "Jerry", "Janet", "Tyler", "Ruth", "Aaron", "Maria", "Jose", "Heather",
  "Adam", "Diane", "Henry", "Virginia", "Douglas", "Julie", "Zachary", "Joyce",
  "Peter", "Victoria", "Kyle", "Olivia", "Walter", "Kelly", "Harold", "Christina",
  "Jeremy", "Lauren", "Keith", "Joan", "Samuel", "Evelyn", "Willie", "Judith",
  "Ralph", "Megan", "Roy", "Andrea", "Russell", "Cheryl", "Louis", "Hannah",
  "Philip", "Jacqueline", "Johnny", "Martha", "Ernest", "Madison", "Martin", "Teresa",
  "Randall", "Sara", "Vincent", "Abigail", "Arthur", "Alice", "Shawn", "Sophia",
  "Clarence", "Natalie", "Sean", "Isabella", "Philip", "Audrey", "Chris", "Ella"
];

// Realistic last names
const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Young",
  "Allen", "King", "Wright", "Scott", "Torres", "Peterson", "Phillips", "Campbell",
  "Parker", "Evans", "Edwards", "Collins", "Reyes", "Stewart", "Morris", "Morales",
  "Murphy", "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Peterson", "Cooper",
  "Peterson", "Reed", "Bell", "Gomez", "Munoz", "Mendoza", "Bush", "Wilkins",
  "Cummings", "Barker", "Bates", "Beard", "Beatty", "Beaumont", "Beaver", "Becker",
  "Beckham", "Beckley", "Beckman", "Beckwith", "Bedell", "Bedford", "Beebe", "Beech",
  "Beeman", "Beers", "Beeson", "Beevers", "Begley", "Behan", "Behnke", "Behrens",
  "Behrmann", "Beier", "Beierle", "Beightol", "Beimel", "Bein", "Beiner", "Beirne",
  "Beisel", "Beisser", "Beiter", "Beitler", "Beitz", "Bejan", "Bejano", "Bejaran",
  "Bejines", "Bejoian", "Bejosano", "Bejudo", "Bekaert", "Bekavac", "Beke", "Beker",
  "Bekermeyer", "Bekesha", "Bekesha", "Bekey", "Bekhuis", "Bekius", "Bekker", "Bekkering"
];

// Generate a random name
export function generateRandomName(): string {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${firstName} ${lastName}`;
}

// Generate multiple unique names
export function generateUniqueNames(count: number): string[] {
  const names = new Set<string>();
  while (names.size < count) {
    names.add(generateRandomName());
  }
  return Array.from(names);
}
