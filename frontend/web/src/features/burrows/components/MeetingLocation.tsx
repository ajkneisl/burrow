import { useMemo } from "react"

/**
 * A building at UMN
 *
 * @param name The name of the building.
 * @param query The Google maps query.
 * @param aliases Possible aliases that this hall could go by.
 */
type Building = {
    name: string
    query: string
    aliases?: string[]
}

// possible buildings at the umn
// could be extended
const umnBuildings: Building[] = [
    // --- East Bank (Minneapolis) ---
    {
        name: "Akerman Hall",
        query: "Akerman Hall, University of Minnesota",
        aliases: ["Akerman"]
    },
    {
        name: "Amundson Hall",
        query: "Amundson Hall, University of Minnesota",
        aliases: ["Amundson"]
    },
    {
        name: "Anderson Hall",
        query: "Anderson Hall, University of Minnesota",
        aliases: ["Anderson"]
    },
    {
        name: "Appleby Hall",
        query: "Appleby Hall, University of Minnesota",
        aliases: ["Appleby"]
    },
    {
        name: "Armory",
        query: "Armory, University of Minnesota",
        aliases: ["The Armory"]
    },
    {
        name: "Biological Sciences Center",
        query: "Biological Sciences Center, University of Minnesota",
        aliases: ["BSC"]
    },
    {
        name: "Boynton Health",
        query: "Boynton Health, University of Minnesota",
        aliases: ["Boynton", "Boynton Health Service"]
    },
    {
        name: "Civil Engineering Building",
        query: "Civil Engineering Building, University of Minnesota",
        aliases: ["CE", "Civil"]
    },
    {
        name: "Coffman Memorial Union",
        query: "Coffman Memorial Union, University of Minnesota",
        aliases: ["Coffman", "CMU", "Union"]
    },
    {
        name: "Computational Mechanics Lab (Shepherd Labs)",
        query: "Shepherd Laboratories, University of Minnesota",
        aliases: ["Shepherd Labs", "Shepherd Laboratories"]
    },
    {
        name: "Diehl Hall",
        query: "Diehl Hall, University of Minnesota",
        aliases: ["Biomedical Library", "Diehl"]
    },
    {
        name: "Eddy Hall",
        query: "Eddy Hall, University of Minnesota",
        aliases: ["Eddy"]
    },
    {
        name: "Elliott Hall",
        query: "Elliott Hall, University of Minnesota",
        aliases: ["Elliott"]
    },
    {
        name: "Folwell Hall",
        query: "Folwell Hall, University of Minnesota",
        aliases: ["Folwell"]
    },
    {
        name: "Ford Hall",
        query: "Ford Hall, University of Minnesota",
        aliases: ["Ford"]
    },
    {
        name: "Fraser Hall",
        query: "Fraser Hall, University of Minnesota",
        aliases: ["Fraser"]
    },
    {
        name: "Jackson Hall",
        query: "Jackson Hall, University of Minnesota",
        aliases: ["Jackson"]
    },
    {
        name: "Jones Hall",
        query: "Jones Hall, University of Minnesota",
        aliases: ["Jones"]
    },
    {
        name: "Keller Hall",
        query: "Keller Hall, University of Minnesota",
        aliases: ["Keller", "EE/CS", "ECS"]
    },
    {
        name: "Kolthoff Hall",
        query: "Kolthoff Hall, University of Minnesota",
        aliases: ["Kolthoff"]
    },
    {
        name: "Lind Hall",
        query: "Lind Hall, University of Minnesota",
        aliases: ["Lind", "LindH"]
    },
    {
        name: "Mayo Building",
        query: "Mayo Building, University of Minnesota",
        aliases: ["Mayo"]
    },
    {
        name: "Mechanical Engineering Building",
        query: "Mechanical Engineering, University of Minnesota",
        aliases: ["ME", "ME Building"]
    },
    {
        name: "Molecular & Cellular Biology",
        query: "Molecular and Cellular Biology, University of Minnesota",
        aliases: ["MCB"]
    },
    {
        name: "Moos Tower",
        query: "Moos Tower, University of Minnesota",
        aliases: ["Moos"]
    },
    {
        name: "Morrill Hall",
        query: "Morrill Hall, University of Minnesota",
        aliases: ["Morrill"]
    },
    {
        name: "Murphy Hall",
        query: "Murphy Hall, University of Minnesota",
        aliases: ["Murphy"]
    },
    {
        name: "Nicholson Hall",
        query: "Nicholson Hall, University of Minnesota",
        aliases: ["Nicholson"]
    },
    {
        name: "Nils Hasselmo Hall",
        query: "Nils Hasselmo Hall, University of Minnesota",
        aliases: ["NHH", "Hasselmo"]
    },
    {
        name: "Northrop",
        query: "Northrop, University of Minnesota",
        aliases: ["Northrop Auditorium", "Northrop Mall"]
    },
    {
        name: "Pillsbury Hall",
        query: "Pillsbury Hall, University of Minnesota",
        aliases: ["Pillsbury"]
    },
    {
        name: "Phillips-Wangensteen Building",
        query: "Phillips-Wangensteen Building, University of Minnesota",
        aliases: ["PWB"]
    },
    {
        name: "RecWell Center (Minneapolis)",
        query: "University Recreation and Wellness Center, University of Minnesota",
        aliases: ["RecWell", "URW"]
    },
    {
        name: "Shepherd Laboratories",
        query: "Shepherd Laboratories, University of Minnesota",
        aliases: ["Shepherd Labs"]
    },
    {
        name: "Smith Hall",
        query: "Smith Hall, University of Minnesota",
        aliases: ["Smith"]
    },
    {
        name: "Tate Hall",
        query: "Tate Hall, University of Minnesota",
        aliases: ["Tate"]
    },
    {
        name: "Vincent Hall",
        query: "Vincent Hall, University of Minnesota",
        aliases: ["Vincent"]
    },
    {
        name: "Walter Library",
        query: "Walter Library, University of Minnesota",
        aliases: ["Walter"]
    },
    {
        name: "Weaver-Densford Hall",
        query: "Weaver-Densford Hall, University of Minnesota",
        aliases: ["WDH", "Nursing"]
    },
    {
        name: "Weisman Art Museum",
        query: "Weisman Art Museum, University of Minnesota",
        aliases: ["WAM", "Weisman"]
    },
    {
        name: "Williamson Hall",
        query: "Williamson Hall, University of Minnesota",
        aliases: ["Williamson"]
    },

    // --- Athletics (East Bank) ---
    {
        name: "Huntington Bank Stadium",
        query: "Huntington Bank Stadium, University of Minnesota",
        aliases: ["TCF Bank Stadium", "Stadium"]
    },
    {
        name: "3M Arena at Mariucci",
        query: "3M Arena at Mariucci, University of Minnesota",
        aliases: ["Mariucci"]
    },
    {
        name: "Maturi Pavilion",
        query: "Maturi Pavilion, University of Minnesota",
        aliases: ["Sports Pavilion", "Volleyball Pavilion"]
    },
    {
        name: "Williams Arena",
        query: "Williams Arena, University of Minnesota",
        aliases: ["The Barn"]
    },
    {
        name: "Ridder Arena",
        query: "Ridder Arena, University of Minnesota",
        aliases: ["Ridder"]
    },

    // --- West Bank (Minneapolis) ---
    {
        name: "Andersen Library",
        query: "Elmer L. Andersen Library, University of Minnesota",
        aliases: ["Andersen Library", "Elmer Andersen"]
    },
    {
        name: "Blegen Hall",
        query: "Blegen Hall, University of Minnesota",
        aliases: ["Blegen"]
    },
    {
        name: "Carlson School of Management",
        query: "Carlson School of Management, University of Minnesota",
        aliases: ["Carlson", "CSOM"]
    },
    {
        name: "Ferguson Hall",
        query: "Ferguson Hall, University of Minnesota",
        aliases: ["Ferguson", "Music"]
    },
    {
        name: "Hanson Hall",
        query: "Herbert M. Hanson Jr. Hall, University of Minnesota",
        aliases: ["Hanson Hall", "Hanson"]
    },
    {
        name: "Humphrey School of Public Affairs",
        query: "Humphrey School of Public Affairs, University of Minnesota",
        aliases: ["HHH", "Humphrey"]
    },
    {
        name: "Law School (Mondale Hall)",
        query: "Walter F. Mondale Hall, University of Minnesota",
        aliases: ["Mondale Hall", "Law School"]
    },
    {
        name: "Rarig Center",
        query: "Rarig Center, University of Minnesota",
        aliases: ["Rarig"]
    },
    {
        name: "Regis Center for Art",
        query: "Regis Center for Art, University of Minnesota",
        aliases: ["Regis", "Katherine E. Nash Gallery"]
    },
    {
        name: "Social Sciences Building",
        query: "Social Sciences Building, University of Minnesota",
        aliases: ["SSB", "Social Sciences"]
    },
    {
        name: "West Bank Skyway/Plaza (Willey Area)",
        query: "Willey Hall, University of Minnesota",
        aliases: ["Willey Area"]
    },
    {
        name: "Willey Hall",
        query: "Willey Hall, University of Minnesota",
        aliases: ["Willey"]
    },
    {
        name: "Wilson Library",
        query: "Wilson Library, University of Minnesota",
        aliases: ["Wilson"]
    },

    // --- St. Paul Campus ---
    {
        name: "Andrew Boss Laboratory of Meat Science",
        query: "Andrew Boss Laboratory of Meat Science, University of Minnesota",
        aliases: ["ABLMS", "Meat Lab"]
    },
    {
        name: "Bailey Hall",
        query: "Bailey Hall, University of Minnesota",
        aliases: ["Bailey Residence Hall"]
    },
    {
        name: "Bell Museum",
        query: "Bell Museum, University of Minnesota",
        aliases: ["Bell Museum of Natural History", "Bell"]
    },
    {
        name: "Borlaug Hall",
        query: "Borlaug Hall, University of Minnesota",
        aliases: ["Borlaug"]
    },
    {
        name: "Cargill Building for Microbial and Plant Genomics",
        query: "Cargill Building for Microbial and Plant Genomics, University of Minnesota",
        aliases: ["Cargill Building", "Plant Genomics"]
    },
    {
        name: "Coffey Hall",
        query: "Coffey Hall, University of Minnesota",
        aliases: ["Coffey"]
    },
    {
        name: "Gortner Laboratory",
        query: "Gortner Laboratory, University of Minnesota",
        aliases: ["Gortner"]
    },
    {
        name: "Green Hall",
        query: "Green Hall, University of Minnesota",
        aliases: ["Green"]
    },
    {
        name: "Haecker Hall",
        query: "Haecker Hall, University of Minnesota",
        aliases: ["Haecker"]
    },
    {
        name: "Hodson Hall",
        query: "Hodson Hall, University of Minnesota",
        aliases: ["Hodson"]
    },
    {
        name: "McNeal Hall",
        query: "McNeal Hall, University of Minnesota",
        aliases: ["McNeal"]
    },
    {
        name: "Magrath Library",
        query: "Magrath Library, University of Minnesota",
        aliases: ["Magrath"]
    },
    {
        name: "Plant Growth Facilities",
        query: "Plant Growth Facilities, University of Minnesota",
        aliases: ["PGF", "Greenhouses"]
    },
    {
        name: "Skok Hall",
        query: "Skok Hall, University of Minnesota",
        aliases: ["Skok"]
    },
    {
        name: "St. Paul Student Center",
        query: "St. Paul Student Center, University of Minnesota",
        aliases: ["SPSC"]
    },
    {
        name: "Veterinary Medical Center",
        query: "Veterinary Medical Center, University of Minnesota",
        aliases: ["VMC", "Vet Med"]
    },

    // --- Biomedical Discovery District (East Bank) ---
    {
        name: "Cancer & Cardiovascular Research Building",
        query: "Cancer and Cardiovascular Research Building, University of Minnesota",
        aliases: ["CCRB"]
    },
    {
        name: "Lions Research Building",
        query: "Lions Research Building, University of Minnesota",
        aliases: ["LRB"]
    },
    {
        name: "McGuire Translational Research Facility",
        query: "McGuire Translational Research Facility, University of Minnesota",
        aliases: ["MTRF"]
    },
    {
        name: "Center for Magnetic Resonance Research",
        query: "Center for Magnetic Resonance Research, University of Minnesota",
        aliases: ["CMRR"]
    },

    // --- Libraries and Museums (additional) ---
    {
        name: "James Ford Bell Library",
        query: "James Ford Bell Library, University of Minnesota",
        aliases: ["Bell Library"]
    },

    // --- Additional academic/administrative ---
    {
        name: "Education Sciences Building",
        query: "Education Sciences Building, University of Minnesota",
        aliases: ["Education Sciences"]
    },
    {
        name: "Johnston Hall",
        query: "Johnston Hall, University of Minnesota",
        aliases: ["Johnston"]
    },
    {
        name: "Nicholson Hall",
        query: "Nicholson Hall, University of Minnesota"
    },
    {
        name: "Rapson Hall",
        query: "Rapson Hall, University of Minnesota",
        aliases: ["Rapson"]
    },
    {
        name: "Tate Laboratory of Physics",
        query: "Tate Laboratory of Physics, University of Minnesota",
        aliases: ["Tate Lab", "Tate"]
    },
    {
        name: "Walter F. Mondale Hall",
        query: "Walter F. Mondale Hall, University of Minnesota",
        aliases: ["Mondale Hall", "Law"]
    },
    {
        name: "Hubert H. Humphrey Center",
        query: "Hubert H. Humphrey Center, University of Minnesota",
        aliases: ["Humphrey Center", "HHH"]
    }
]

// api key for maps
// TODO: possibly get our own
const API_KEY = "AIzaSyB2NIWI3Tv9iDPrlnowr_0ZqZWoAQydKJU"

/**
 * {@link MeetingLocation}
 */
type MeetingLocationProps = {
    location: string
}

/**
 * Provides a Google Maps integration off of the user provided meeting location.
 *
 * @param location The user-provided location of the meeting.
 */
export default function MeetingLocation({ location }: MeetingLocationProps) {
    // see if one of the building includes location
    const hit = useMemo(() => {
        if (!location) return null

        const lower = location.toLowerCase()

        for (const building of umnBuildings) {
            if (lower.includes(building.name.toLowerCase()))
                return building.query

            if (building.aliases?.some((a) => lower.includes(a.toLowerCase())))
                return building.query
        }

        return null
    }, [location])

    return (
        <section className="border-primary/30 bg-card/80 rounded-2xl border shadow-sm">
            <div className="p-4">
                <h3 className="text-maroon-800 mb-2 text-sm font-semibold">
                    Location
                </h3>

                {location}
            </div>

            {hit && (
                <iframe
                    title="map"
                    className="border-primary/20 h-64 w-full rounded-b-2xl border-t"
                    src={`https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=${encodeURIComponent(
                        hit
                    )}&maptype=roadmap`}
                    loading="lazy"
                />
            )}
        </section>
    )
}
