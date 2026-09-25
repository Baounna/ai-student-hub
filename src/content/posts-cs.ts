import type { BlogPost } from "@/content/posts";

const dsaForAiEngineersContent = [
  "The version of this that costs you a weekend is not an interview question about sorting. It is a deduplication pass that was instant on a 2,000-row sample and is still running on the full export. Nothing about the model changed. One line inside the loop is scanning a list.",
  "Two commands tell the whole story, and you can run them now: python3 -m timeit -s \"xs=list(range(100_000))\" \"999_999 in xs\", then the same thing with xs=set(range(100_000)). On the machine this was written on, the list answered in about 885 microseconds and the set in about 10 nanoseconds. One lookup either way is invisible. A lookup per row is not.",
  "Put that in a loop and the gap stops being academic. Deduplicating 100,000 integers with seen = [] and if row not in seen took 42 seconds here. The same loop with seen = set() took 14 milliseconds and produced the identical 95,154 rows. That is the difference between a step you rerun on every change and a step you quietly stop running. Any time a loop asks whether it has seen something before, the answer belongs in a set or a dict.",
  "The same trap has a second form: list.pop(0). Removing from the front of a list shifts every remaining element, which the Python documentation states plainly — lists are optimised for fast fixed-length operations and incur O(n) memory movement costs for pop(0) and insert(0, v). Draining a 100,000-item list from the front took 0.78 seconds in the same test; collections.deque with popleft() took 3.3 milliseconds. If a worker consumes a backlog in arrival order, the deque is the default and the list is the bug.",
  "Top-k is where the habit of sorting everything shows up. Picking the ten best of a million scores with sorted(xs, reverse=True)[:10] took 148 milliseconds; heapq.nlargest(10, xs) took 16 and returned the same ten, because the heap never puts the other 999,990 in order. The docs also give you the boundary honestly: nlargest and nsmallest perform best for small values of n, sorted() is more efficient as n grows toward the length of the input, and for n of exactly 1 you want min() or max().",
  "Past a certain table size the bottleneck moves into the database, where no amount of Python helps. Ask instead of guessing: EXPLAIN (ANALYZE, BUFFERS) SELECT ... makes PostgreSQL run the query and print what it actually did, with real row counts and timings. A Seq Scan over a large table under a selective WHERE is the line you are looking for.",
  "Knowing what an index covers is what stops you adding one that does nothing. A B-tree, the PostgreSQL default, serves <, <=, =, >=, >, BETWEEN, IN, IS NULL and ORDER BY on the indexed column. It serves LIKE 'foo%' too, because the pattern is anchored to the start — but only if the database runs in the C locale or you created the index with the text_pattern_ops operator class, which is why a search box can stay slow while a perfectly good index sits next to it. LIKE '%foo' is never served by a B-tree. And on an index over (a, b), a query filtering only on b cannot use it: the leftmost column has to be constrained.",
  "Vector search is the same decision wearing different words. FAISS's IndexFlatL2 is exact brute force — it compares the query against every stored vector, so it is slow and always right. IndexIVFFlat partitions the space first, which is why it must be trained on a sample before you add anything, and why nprobe at query time chooses how many partitions get searched: more partitions, better recall, more latency. The mistake is shipping the approximate index without ever measuring what it gave up. You have the ground truth for free — run the same queries through a flat index and count how many of the true top-k came back.",
  "The counter-rule deserves equal weight. A nested loop over 500 rows is 250,000 comparisons, which finishes before you notice, and replacing it with a structure you then have to keep in sync is a real cost paid for nothing. The question is never which structure is better in the abstract. It is how large n actually gets, how often the code runs, and whether you have measured it.",
  "Measure before you rewrite, because the slow line is rarely the suspected one. python3 -m cProfile -s cumtime your_script.py | head -25 ranks functions by cumulative time and costs nothing to set up. For one block inside a long job, bracket it with time.perf_counter() and print the difference. Both beat reading the code and forming an opinion, which is what most optimisation is actually based on.",
  "Graphs earn their place when the problem is dependencies rather than rows — pipeline steps, for instance. You do not have to implement a topological sort for that: graphlib.TopologicalSorter has been in the standard library since Python 3.9, returns a valid order from a dict mapping each step to its prerequisites, and raises CycleError naming the cycle when two steps depend on each other. Being told exactly which two is worth more than a graph library you never finish.",
  "None of this needs a semester of theory. It needs the habit of putting a number next to a change: this pass took 42 seconds, it now takes 14 milliseconds, here is the one-line diff. That number is also the only thing that makes the decision reviewable three months later, when someone asks why the code looks like that."
];

const dsaForAiEngineersContentFr = [
  "La version de ce problème qui vous coûte un week-end n'est pas une question d'entretien sur le tri. C'est une passe de déduplication instantanée sur un échantillon de 2 000 lignes et toujours en cours sur l'export complet. Rien n'a changé du côté du modèle. Une ligne à l'intérieur de la boucle parcourt une liste.",
  "Deux commandes racontent toute l'histoire, et vous pouvez les lancer maintenant : python3 -m timeit -s \"xs=list(range(100_000))\" \"999_999 in xs\", puis la même chose avec xs=set(range(100_000)). Sur la machine où ce texte a été écrit, la liste répond en 885 microsecondes environ et le set en 10 nanosecondes environ. Une recherche isolée est invisible dans les deux cas. Une recherche par ligne ne l'est pas.",
  "Mettez cela dans une boucle et l'écart cesse d'être théorique. Dédupliquer 100 000 entiers avec seen = [] et if row not in seen a pris 42 secondes ici. La même boucle avec seen = set() a pris 14 millisecondes et produit exactement les mêmes 95 154 lignes. C'est la différence entre une étape que vous relancez à chaque modification et une étape que vous cessez discrètement de lancer. Dès qu'une boucle demande si elle a déjà vu quelque chose, la réponse appartient à un set ou à un dict.",
  "Le même piège a une seconde forme : list.pop(0). Retirer un élément en tête décale tous les suivants, et la documentation Python le dit sans détour — les listes sont optimisées pour les opérations à longueur fixe et paient un déplacement mémoire en O(n) pour pop(0) et insert(0, v). Vider une liste de 100 000 éléments par la tête a pris 0,78 seconde dans le même test ; collections.deque avec popleft() a pris 3,3 millisecondes. Si un worker consomme une file dans l'ordre d'arrivée, le deque est le choix par défaut et la liste est le bug.",
  "Le top-k est l'endroit où l'habitude de tout trier se voit. Extraire les dix meilleurs scores parmi un million avec sorted(xs, reverse=True)[:10] a pris 148 millisecondes ; heapq.nlargest(10, xs) en a pris 16 et a renvoyé les mêmes dix, parce que le tas n'ordonne jamais les 999 990 autres. La documentation donne aussi la frontière honnêtement : nlargest et nsmallest sont meilleurs pour de petites valeurs de n, sorted() reprend l'avantage quand n s'approche de la taille de l'entrée, et pour n égal à 1 il faut min() ou max().",
  "Au-delà d'une certaine taille de table, le goulot passe dans la base de données, où aucun code Python n'aide. Demandez au lieu de deviner : EXPLAIN (ANALYZE, BUFFERS) SELECT ... fait exécuter la requête par PostgreSQL et affiche ce qu'il a réellement fait, avec le nombre de lignes et les temps réels. Un Seq Scan sur une grande table sous un WHERE sélectif est la ligne que vous cherchez.",
  "Savoir ce qu'un index couvre est ce qui vous évite d'en ajouter un qui ne sert à rien. Un B-tree, l'index par défaut de PostgreSQL, sert <, <=, =, >=, >, BETWEEN, IN, IS NULL et ORDER BY sur la colonne indexée. Il sert aussi LIKE 'foo%', parce que le motif est ancré au début — mais seulement si la base tourne en locale C ou si vous avez créé l'index avec la classe d'opérateurs text_pattern_ops, ce qui explique qu'un champ de recherche reste lent alors qu'un index parfaitement valable se trouve juste à côté. LIKE '%foo' n'est jamais servi par un B-tree. Et sur un index portant sur (a, b), une requête qui ne filtre que sur b ne peut pas l'utiliser : la colonne la plus à gauche doit être contrainte.",
  "La recherche vectorielle est la même décision sous d'autres mots. L'IndexFlatL2 de FAISS est une recherche exacte par force brute : il compare la requête à chaque vecteur stocké, donc il est lent et toujours juste. IndexIVFFlat partitionne d'abord l'espace, ce qui explique qu'il doive être entraîné sur un échantillon avant tout ajout, et que nprobe décide au moment de la requête combien de partitions sont explorées : plus de partitions, meilleur rappel, plus de latence. L'erreur est de livrer l'index approximatif sans jamais mesurer ce qu'il a perdu. Vous avez la vérité terrain gratuitement : passez les mêmes requêtes dans un index plat et comptez combien du vrai top-k est revenu.",
  "La règle inverse mérite autant d'attention. Une boucle imbriquée sur 500 lignes, c'est 250 000 comparaisons, terminées avant que vous ne le remarquiez, et la remplacer par une structure qu'il faut ensuite tenir à jour est un coût réel payé pour rien. La question n'est jamais quelle structure est la meilleure dans l'absolu. C'est jusqu'où n monte réellement, à quelle fréquence le code tourne, et si vous l'avez mesuré.",
  "Mesurez avant de réécrire, car la ligne lente est rarement celle que l'on soupçonne. python3 -m cProfile -s cumtime votre_script.py | head -25 classe les fonctions par temps cumulé et ne demande aucune préparation. Pour un bloc précis dans un traitement long, encadrez-le avec time.perf_counter() et affichez la différence. Les deux valent mieux que lire le code et se forger une opinion, ce sur quoi repose pourtant la plupart des optimisations.",
  "Les graphes méritent leur place quand le problème porte sur des dépendances plutôt que sur des lignes — les étapes d'un pipeline, par exemple. Nul besoin d'implémenter un tri topologique : graphlib.TopologicalSorter est dans la bibliothèque standard depuis Python 3.9, renvoie un ordre valide à partir d'un dict associant chaque étape à ses prérequis, et lève CycleError en nommant le cycle quand deux étapes dépendent l'une de l'autre. Savoir exactement lesquelles vaut mieux qu'une bibliothèque de graphes que vous ne terminez jamais.",
  "Rien de tout cela n'exige un semestre de théorie. Cela exige l'habitude de mettre un chiffre à côté d'un changement : cette passe prenait 42 secondes, elle en prend 14 millisecondes, voici le diff d'une ligne. Ce chiffre est aussi la seule chose qui rend la décision relisible trois mois plus tard, quand quelqu'un demande pourquoi le code a cette forme."
];

const systemDesignForStudentsContent = [
  "A student demo works because there is exactly one user, they click one thing at a time, and they wait. Every architectural problem you will meet arrives when one of those three stops being true. The useful exercise is not drawing more boxes; it is deciding, in advance and in numbers, what your system does when a request takes too long, when the same request arrives twice, and when the service you depend on is down.",
  "Start with one latency budget and make everything fit inside it. Pick a target — say p95 under three seconds for the answer a user waits for — then subtract. If the model provider's slow requests take two seconds, one second is left for everything else: authentication, retrieval, database, serialisation, network. Written that way, the budget makes decisions for you. It tells you that a synchronous re-ranking pass costing 800 milliseconds does not fit, and it tells you which number to go and measure first.",
  "Then give every call leaving your process an explicit deadline, because the defaults are not what you assume. Python's requests library does not time out at all unless you pass timeout=; its documentation says so and warns that failing to do so can hang your program indefinitely. httpx raises after five seconds of network inactivity. PostgreSQL's statement_timeout defaults to zero, which means no limit, so one query with a missing index can hold a connection until a human notices. Deadlines also have to shrink as you go down the stack: if your HTTP server gives up at thirty seconds, the model call inside it must give up sooner, or the client gets nothing while the work continues and the bill keeps running.",
  "Anything that cannot fit the budget should stop pretending to be synchronous. The pattern is small: POST /jobs validates the input, writes a row and returns 202 Accepted with a job id; a worker does the work; GET /jobs/{id} returns the status, and the result once it exists. That costs one table and one polling loop in the client. It buys you that a slow job no longer occupies a request thread, that a user closing the tab no longer wastes the compute, and that you can retry the work without replaying the request.",
  "Retries need rules rather than enthusiasm. Retry on timeouts, 429 and 503; never retry 400 or 422, because the input was wrong and will be wrong again. Back off exponentially and add jitter — without jitter, every client that failed during the same outage retries at the same instant and takes the service down a second time. And a retried POST that creates rows creates them twice, unless the endpoint accepts a client-supplied idempotency key that you store and check before doing the work.",
  "Design the data model around the questions you will need answered during an incident. Keep the entities you mutate — users, jobs, documents — in tables with real columns and constraints, and keep the append-only record of what happened — request logs, evaluation results, token counts — separate, with a retention window. The anti-pattern is a single payload jsonb column holding everything, and its cost is specific: at three in the morning you cannot answer how many jobs failed in the last hour and with which error without scanning and parsing every row.",
  "Cache what is deterministic and nothing else. An embedding is a pure function of the text and the model, so it can be cached indefinitely under a hash of the input — and on a corpus you re-index often, that is the single largest cost reduction available to a student project. A chat completion is not deterministic and usually should not be cached at all. Whatever you do cache, the key must include the model name and a version of your prompt, or the day you improve the prompt is the day you start serving answers the old one produced.",
  "Decide each dependency's failure behaviour once, and write it down next to the code. If the model provider times out, return 503 with a Retry-After header — not 500, and above all not an empty result that the interface renders as a confident blank answer. If retrieval returns nothing, say so instead of letting the model fill the silence. Degrading visibly is a design choice; degrading invisibly is the failure mode that survives into production precisely because nothing looks broken.",
  "Scaling at student scale has one fact that matters more than any diagram: each Uvicorn or Gunicorn worker is a separate operating system process with its own memory. Four workers means four copies of everything loaded at startup. With a transformer held in memory that is four times the model's footprint, and on a small instance it is the out-of-memory kill you are about to spend an evening on. The fix is to put the model behind a single process the API talks to, not to add workers until the machine dies.",
  "Make one request traceable end to end. Generate an identifier at the edge, put it in every log line in every component, and return it to the client inside the error envelope. The test is concrete: given an id from a user's screenshot, can you find every line that request produced, in order, in under a minute? If not, the logging is not finished — and you will find that out during the incident rather than before it.",
  "Keep the architecture at the size your evidence justifies. A modular monolith with clear internal boundaries is the right shape for almost every student project, because splitting into services buys independent deployment and scaling at the price of network calls, partial failures and distributed debugging — costs paid immediately for benefits you may never need. Split when one component genuinely needs different hardware or a different release cadence. That is a reason; \"microservices are how real systems are built\" is not.",
  "Write the numbers down: the budget, the timeouts, the retry rules, the fallback per dependency. A one-page design note stating them is more useful than five diagrams, because it is the only version of the architecture that can be shown to be wrong."
];

const systemDesignForStudentsContentFr = [
  "Une démonstration étudiante fonctionne parce qu'il y a exactement un utilisateur, qu'il clique sur une chose à la fois et qu'il attend. Tous les problèmes d'architecture que vous rencontrerez arrivent quand l'une de ces trois conditions cesse d'être vraie. L'exercice utile n'est pas de dessiner plus de boîtes : c'est de décider à l'avance, et en chiffres, ce que fait votre système quand une requête dure trop longtemps, quand la même requête arrive deux fois, et quand le service dont vous dépendez est en panne.",
  "Commencez par un seul budget de latence et faites tout entrer dedans. Fixez une cible — disons un p95 sous trois secondes pour la réponse qu'un utilisateur attend — puis soustrayez. Si les requêtes lentes du fournisseur de modèle prennent deux secondes, il reste une seconde pour tout le reste : authentification, recherche, base de données, sérialisation, réseau. Écrit ainsi, le budget décide à votre place. Il vous dit qu'une passe de reclassement synchrone à 800 millisecondes n'entre pas, et il vous dit quel chiffre aller mesurer en premier.",
  "Donnez ensuite un délai explicite à chaque appel qui sort de votre processus, car les valeurs par défaut ne sont pas celles que vous imaginez. La bibliothèque requests de Python n'expire pas du tout tant que vous ne passez pas timeout= ; sa documentation le dit et avertit que s'en abstenir peut bloquer votre programme indéfiniment. httpx lève une exception après cinq secondes d'inactivité réseau. Le statement_timeout de PostgreSQL vaut zéro par défaut, c'est-à-dire aucune limite, si bien qu'une requête privée d'index peut retenir une connexion jusqu'à ce qu'un humain le remarque. Les délais doivent aussi décroître en descendant la pile : si votre serveur HTTP abandonne à trente secondes, l'appel au modèle qu'il contient doit abandonner plus tôt, sinon le client n'obtient rien pendant que le travail continue et que la facture court.",
  "Tout ce qui n'entre pas dans le budget doit cesser de faire semblant d'être synchrone. Le motif est court : POST /jobs valide l'entrée, écrit une ligne et renvoie 202 Accepted avec un identifiant de tâche ; un worker fait le travail ; GET /jobs/{id} renvoie le statut, puis le résultat quand il existe. Cela coûte une table et une boucle d'interrogation côté client. Cela vous rapporte qu'une tâche lente n'occupe plus un thread de requête, qu'un utilisateur qui ferme l'onglet ne gaspille plus le calcul, et que vous pouvez réessayer le travail sans rejouer la requête.",
  "Les reprises demandent des règles, pas de l'enthousiasme. Réessayez sur les expirations, les 429 et les 503 ; ne réessayez jamais sur un 400 ou un 422, car l'entrée était mauvaise et le restera. Reculez de façon exponentielle et ajoutez du bruit aléatoire — sans lui, tous les clients tombés pendant la même panne réessaient au même instant et font tomber le service une deuxième fois. Et un POST rejoué qui crée des lignes en crée deux fois, sauf si l'endpoint accepte une clé d'idempotence fournie par le client, que vous stockez et vérifiez avant d'agir.",
  "Concevez le modèle de données autour des questions auxquelles il faudra répondre pendant un incident. Gardez les entités que vous modifiez — utilisateurs, tâches, documents — dans des tables aux colonnes et contraintes réelles, et gardez à part, avec une durée de rétention, la trace en ajout seul de ce qui s'est passé : journaux de requêtes, résultats d'évaluation, décomptes de tokens. L'anti-motif est une unique colonne payload jsonb qui contient tout, et son coût est précis : à trois heures du matin, vous ne pouvez pas répondre à combien de tâches ont échoué dans la dernière heure et avec quelle erreur sans parcourir et analyser chaque ligne.",
  "Mettez en cache ce qui est déterministe, et rien d'autre. Un embedding est une fonction pure du texte et du modèle : il peut donc être mis en cache indéfiniment sous une empreinte de l'entrée — et sur un corpus que vous réindexez souvent, c'est la plus grosse réduction de coût accessible à un projet étudiant. Une complétion de conversation n'est pas déterministe et ne devrait généralement pas être mise en cache du tout. Quoi que vous mettiez en cache, la clé doit inclure le nom du modèle et une version de votre prompt, sinon le jour où vous améliorez le prompt est le jour où vous commencez à servir les réponses produites par l'ancien.",
  "Décidez une fois du comportement de chaque dépendance en panne, et écrivez-le à côté du code. Si le fournisseur de modèle expire, renvoyez un 503 avec un en-tête Retry-After — pas un 500, et surtout pas un résultat vide que l'interface affichera comme une réponse blanche pleine d'assurance. Si la recherche ne remonte rien, dites-le au lieu de laisser le modèle combler le silence. Se dégrader visiblement est un choix de conception ; se dégrader invisiblement est le mode de défaillance qui survit jusqu'en production, précisément parce que rien n'a l'air cassé.",
  "À l'échelle étudiante, la montée en charge tient à un fait qui compte plus que n'importe quel schéma : chaque worker Uvicorn ou Gunicorn est un processus système distinct avec sa propre mémoire. Quatre workers, ce sont quatre copies de tout ce qui est chargé au démarrage. Avec un transformeur en mémoire, cela fait quatre fois l'empreinte du modèle, et sur une petite instance c'est le kill pour mémoire insuffisante auquel vous allez consacrer une soirée. La solution est de placer le modèle derrière un unique processus auquel l'API s'adresse, pas d'ajouter des workers jusqu'à ce que la machine tombe.",
  "Rendez une requête traçable de bout en bout. Générez un identifiant à l'entrée, placez-le dans chaque ligne de journal de chaque composant, et renvoyez-le au client dans l'enveloppe d'erreur. Le test est concret : à partir d'un identifiant vu sur la capture d'écran d'un utilisateur, pouvez-vous retrouver toutes les lignes produites par cette requête, dans l'ordre, en moins d'une minute ? Sinon, la journalisation n'est pas terminée — et vous l'apprendrez pendant l'incident plutôt qu'avant.",
  "Gardez une architecture à la taille que vos preuves justifient. Un monolithe modulaire aux frontières internes claires est la bonne forme pour presque tout projet étudiant, car découper en services achète du déploiement et de la montée en charge indépendants au prix d'appels réseau, de pannes partielles et de débogage distribué — des coûts payés tout de suite pour des bénéfices dont vous n'aurez peut-être jamais besoin. Découpez quand un composant a réellement besoin d'un autre matériel ou d'un autre rythme de livraison. C'est une raison ; « les vrais systèmes sont faits en microservices » n'en est pas une.",
  "Écrivez les chiffres : le budget, les délais, les règles de reprise, le repli par dépendance. Une note de conception d'une page qui les énonce est plus utile que cinq schémas, parce que c'est la seule version de l'architecture dont on puisse démontrer qu'elle est fausse."
];

const backendApisForMlAppsContent = [
  "In a notebook the model is loaded once in a cell and every call reuses it. Move the same code into a request handler and it loads on every request. That single difference is most of what makes the first version of a student ML API unusably slow, and it hides well, because the first request is slow for a reason that looks like an ordinary cold start.",
  "Load the model once at startup and keep it on the application object — in FastAPI, a lifespan handler that loads before the server accepts traffic and stores it on app.state. Two symptoms confirm this is your bug: latency does not improve after the first call, and memory climbs steadily under repeated requests. Do the same for everything else expensive to construct — the database connection pool, the HTTP client, the tokenizer.",
  "The second mistake belongs to async frameworks and is extremely common. FastAPI runs a path operation declared with plain def in an external threadpool, precisely so that blocking work does not block the server. A path operation declared async def runs directly on the event loop, so any blocking call inside it — local inference, a synchronous database driver, requests — freezes every other request in that process until it returns. The rule is mechanical: if the handler awaits, write async def; if it blocks, write def and let the threadpool do its job.",
  "Define the request and the response as Pydantic models and hand them to FastAPI. Validation then happens before your code runs, /docs and /openapi.json become a contract you never maintain separately, and response_model stops an internal field leaking into a response by accident. Invalid requests come back as a 422 naming the offending field, which is considerably more useful to whoever is integrating than a 500 raised deep inside your function.",
  "One line of that schema deserves calling out: the length limit. text: str = Field(max_length=4000) turns an unbounded prompt into a 422 before you have paid for a single token. Unbounded input on an inference endpoint is not only a reliability problem — it is the mechanism by which a free project becomes an invoice, and closing it costs one keyword argument.",
  "Give every error the same shape: a stable machine-readable code, a message safe to show a user, and the request id. Log the stack trace internally and never return it — it tells a stranger about your internals and tells your user nothing. When someone reports a failure, the id in that envelope is what turns a support message into a log query.",
  "Test the guards, not the happy path. Three tests with TestClient cover most of what actually breaks: oversized input returns 422; a request for another user's record returns 404 rather than their data; the provider raising an exception returns 503 in your envelope rather than a 500 with a traceback. That is roughly twenty lines, and it is the difference between believing those behaviours exist and knowing that they do.",
  "Keep a small golden set for anything model-shaped. Twenty inputs with the properties the output must hold — contains a citation, refuses when the context is empty, parses as valid JSON — run on every prompt or model change. Prompt edits are code changes with no compiler behind them, and this file is the only thing between you and a quality regression you notice a week later.",
  "Make the health endpoint tell the truth. One that returns 200 unconditionally is worse than none, because it gets traffic routed to a process whose model is still loading. Have it check what the service actually needs — model loaded, database reachable — and have it report the running version, ideally the git commit, so that \"is my fix deployed\" becomes a question you answer with curl instead of a guess.",
  "Record cost per request the way you record latency: tokens in, tokens out, model name, endpoint, duration. Without that breakdown a bill is an unexplained total; with it, \"which endpoint is expensive and why\" has an answer, and so does \"did the new prompt make things worse\". Rate limit per API key on top of it, because a limit that only counts IP addresses stops nothing that matters.",
  "Version the contract before you have consumers, because it is cheap then and expensive afterwards. Adding a field is safe; removing one, renaming one, or changing its type is not, and \"only my own frontend uses it\" stops being true the first time a classmate builds against it. A path prefix and a changelog entry per breaking change is the whole discipline.",
  "One API that does all of this — loads its model once, validates its input, bounds its dependencies, returns a usable error and can be traced — demonstrates more than a repository full of notebooks, because each of those behaviours is a decision someone else can inspect."
];

const backendApisForMlAppsContentFr = [
  "Dans un notebook, le modèle est chargé une fois dans une cellule et chaque appel le réutilise. Déplacez le même code dans un gestionnaire de requête et il se recharge à chaque requête. Cette seule différence explique l'essentiel de la lenteur inutilisable de la première version d'une API ML étudiante, et elle se cache bien : la première requête est lente pour une raison qui ressemble à un démarrage à froid ordinaire.",
  "Chargez le modèle une fois au démarrage et gardez-le sur l'objet application — en FastAPI, un gestionnaire lifespan qui charge avant que le serveur n'accepte du trafic et le stocke sur app.state. Deux symptômes confirment le diagnostic : la latence ne s'améliore pas après le premier appel, et la mémoire monte régulièrement sous des requêtes répétées. Faites de même pour tout ce qui est coûteux à construire : le pool de connexions à la base, le client HTTP, le tokenizer.",
  "La deuxième erreur appartient aux frameworks asynchrones et elle est extrêmement répandue. FastAPI exécute une opération de chemin déclarée avec un def simple dans un threadpool externe, précisément pour qu'un traitement bloquant ne bloque pas le serveur. Une opération déclarée async def s'exécute directement sur la boucle d'événements, si bien que tout appel bloquant à l'intérieur — inférence locale, pilote de base de données synchrone, requests — gèle toutes les autres requêtes de ce processus jusqu'à son retour. La règle est mécanique : si le gestionnaire attend avec await, écrivez async def ; s'il bloque, écrivez def et laissez le threadpool faire son travail.",
  "Définissez la requête et la réponse comme des modèles Pydantic et confiez-les à FastAPI. La validation a alors lieu avant votre code, /docs et /openapi.json deviennent un contrat que vous n'entretenez jamais séparément, et response_model empêche un champ interne de fuir par accident dans une réponse. Les requêtes invalides reviennent en 422 en nommant le champ fautif, ce qui est nettement plus utile à qui intègre votre API qu'un 500 levé au fond de votre fonction.",
  "Une ligne de ce schéma mérite d'être signalée : la limite de longueur. text: str = Field(max_length=4000) transforme un prompt sans borne en 422 avant que vous n'ayez payé le moindre token. Une entrée sans borne sur un endpoint d'inférence n'est pas qu'un problème de fiabilité : c'est le mécanisme par lequel un projet gratuit devient une facture, et le fermer coûte un argument nommé.",
  "Donnez à chaque erreur la même forme : un code stable lisible par machine, un message que l'on peut montrer à un utilisateur, et l'identifiant de requête. Journalisez la trace d'exécution en interne et ne la renvoyez jamais — elle renseigne un inconnu sur vos entrailles et n'apprend rien à votre utilisateur. Quand quelqu'un signale une panne, l'identifiant contenu dans cette enveloppe est ce qui transforme un message de support en requête dans les journaux.",
  "Testez les garde-fous, pas le chemin nominal. Trois tests avec TestClient couvrent l'essentiel de ce qui casse vraiment : une entrée trop grande renvoie 422 ; une requête portant sur l'enregistrement d'un autre utilisateur renvoie 404 plutôt que ses données ; le fournisseur qui lève une exception donne un 503 dans votre enveloppe plutôt qu'un 500 avec une trace. Cela fait une vingtaine de lignes, et c'est la différence entre croire que ces comportements existent et savoir qu'ils existent.",
  "Gardez un petit jeu de référence pour tout ce qui touche au modèle. Vingt entrées avec les propriétés que la sortie doit respecter — contient une citation, refuse quand le contexte est vide, s'analyse comme du JSON valide — exécutées à chaque changement de prompt ou de modèle. Modifier un prompt est un changement de code sans compilateur derrière, et ce fichier est la seule chose qui vous sépare d'une régression de qualité que vous constatez une semaine plus tard.",
  "Faites dire la vérité à l'endpoint de santé. Un endpoint qui renvoie 200 sans condition est pire que rien, car il fait router du trafic vers un processus dont le modèle est encore en cours de chargement. Faites-lui vérifier ce dont le service a réellement besoin — modèle chargé, base joignable — et faites-lui rapporter la version en cours d'exécution, idéalement le commit git, pour que « mon correctif est-il déployé » devienne une question à laquelle on répond avec curl plutôt qu'au jugé.",
  "Enregistrez le coût par requête comme vous enregistrez la latence : tokens en entrée, tokens en sortie, nom du modèle, endpoint, durée. Sans ce détail, une facture est un total inexpliqué ; avec lui, « quel endpoint coûte cher et pourquoi » a une réponse, et « le nouveau prompt a-t-il aggravé les choses » aussi. Limitez le débit par clé d'API par-dessus, car une limite qui ne compte que les adresses IP n'arrête rien d'important.",
  "Versionnez le contrat avant d'avoir des consommateurs, parce que c'est bon marché à ce moment-là et cher ensuite. Ajouter un champ est sans danger ; en supprimer un, en renommer un ou changer son type ne l'est pas, et « seul mon propre frontend l'utilise » cesse d'être vrai la première fois qu'un camarade développe contre votre API. Un préfixe de chemin et une entrée de journal des changements par rupture : la discipline tient entière là-dedans.",
  "Une seule API qui fait tout cela — charge son modèle une fois, valide son entrée, borne ses dépendances, renvoie une erreur exploitable et se laisse tracer — démontre plus qu'un dépôt rempli de notebooks, parce que chacun de ces comportements est une décision que quelqu'un d'autre peut inspecter."
];

const linuxDevopsWorkflowContent = [
  "Deploy day is when you discover that your project depended on things you never wrote down: the Python you happen to have, a file that exists only on your laptop, an environment variable you exported once in a terminal three weeks ago. What follows is not enterprise practice scaled down. It is the specific set of commands and habits that resolve the failures students actually hit on a small Linux server.",
  "First, know where the logs are before you need them. On a systemd host, journalctl -u myapp -n 200 --no-pager prints the last two hundred lines for one service, journalctl -u myapp -f follows them live, and journalctl -u myapp --since -15min -p err narrows to errors in the last quarter of an hour. Note the leading dash in -15min: journalctl takes relative times prefixed with - or +. Under Docker the equivalents are docker logs --tail 200 <name> and docker logs -f --since 15m <name>.",
  "The most common way a small server dies is a full disk. df -h shows which filesystem reached 100%, du -sh /var/log/* | sort -h | tail finds what grew, and on a Docker host docker system df usually explains it, because build caches and dangling images accumulate on every deploy. docker system prune -a reclaims that space, and the -a is worth understanding before you type it: it removes every image not used by a running container, which includes the previous version you would have rolled back to.",
  "The second most common is the out-of-memory killer, whose signature is that your application logs say nothing at all — the process was killed outright, so it had no chance to complain. docker inspect --format '{{.State.OOMKilled}}' <name> answers the question directly, and an exit code of 137 is the same message in the shell's convention of 128 plus the signal number, 9 being SIGKILL. The answer is a memory limit and a smaller model, not a restart policy that turns a crash into a loop.",
  "Check what your server actually exposes, because this is where a hobby project becomes an incident. ss -ltnp lists every listening TCP socket together with the process holding it. Anything bound to 0.0.0.0 is reachable from the internet if the firewall allows it, and docker run -p 5432:5432 publishes on all interfaces by default — which is how student databases end up found by scanners. Bind application services to 127.0.0.1 behind a reverse proxy, or publish explicitly, as in -p 127.0.0.1:5432:5432.",
  "Make installs reproducible with a lockfile and a command that respects it. npm ci is not a faster npm install: it requires a lockfile, removes node_modules before it starts, never writes to package.json or the lockfile, and exits with an error if the two disagree. That last behaviour is the point, because the alternative quietly resolves a different dependency tree on the server than the one you tested. In Python, pin versions in requirements.txt rather than listing bare names, and build the environment from that file on a clean machine before you believe it.",
  "Two details make a Dockerfile behave. Copy the manifest and lockfile first, install, then copy the source: put COPY . . above the install step and a one-character source change invalidates the dependency layer, so every build reinstalls everything. And write a .dockerignore containing at least .git, node_modules and .env — the build context is sent to the daemon in full, so without it you upload your entire history on every build and, with the wrong COPY, bake your secrets into the image.",
  "Start every deploy script with set -euo pipefail. Without -e a failed step is ignored and the script reports success over a half-updated application; without -o pipefail a failure in the middle of a pipeline is masked by the exit status of the last command. Three words at the top of the file turn a silent partial deploy into an obvious stop.",
  "Let systemd own the process. A unit with Restart=on-failure and RestartSec=5 brings the service back after a crash, and systemctl status myapp shows the state and the last log lines together. One trap: after editing a unit file you must run systemctl daemon-reload before restarting, or systemd keeps running the old definition and you debug a change that was never applied. Another: a restart policy in front of a configuration error produces a service that flaps forever while looking alive in a dashboard, so read the logs after enabling it, not instead of it.",
  "Keep secrets out of the repository, and understand what out means. .env belongs in .gitignore before the first commit. If it is already committed, git rm --cached .env only removes it going forward — the value is in the history, the history is in every clone, and public repositories are scanned continuously by people looking for exactly this. The key has to be rotated, and nothing you do to the repository substitutes for that.",
  "Finish every deploy with the same ten-minute check: curl the health endpoint and confirm it reports the version you just shipped, watch journalctl -u myapp -f for two minutes, run df -h and free -h, and exercise the one path that matters most to a user. Silent failures are the ones that survive — an endpoint returning 200 with an empty body will never wake you up — and this check is where you catch it instead of a user.",
  "The point is not that these commands are advanced. It is that each one replaces a guess with an answer, and the time an operational habit saves is the time you would otherwise spend rediscovering at midnight which of five possible things went wrong."
];

const linuxDevopsWorkflowContentFr = [
  "Le jour du déploiement est celui où vous découvrez que votre projet dépendait de choses que vous n'aviez jamais notées : le Python que vous avez par hasard, un fichier qui n'existe que sur votre portable, une variable d'environnement exportée une fois dans un terminal il y a trois semaines. Ce qui suit n'est pas une pratique d'entreprise réduite à l'échelle. C'est l'ensemble précis de commandes et d'habitudes qui règlent les pannes que les étudiants rencontrent réellement sur un petit serveur Linux.",
  "D'abord, sachez où sont les journaux avant d'en avoir besoin. Sur un hôte systemd, journalctl -u myapp -n 200 --no-pager affiche les deux cents dernières lignes d'un service, journalctl -u myapp -f les suit en direct, et journalctl -u myapp --since -15min -p err restreint aux erreurs du dernier quart d'heure. Remarquez le tiret initial de -15min : journalctl accepte des temps relatifs préfixés par - ou +. Sous Docker, les équivalents sont docker logs --tail 200 <nom> et docker logs -f --since 15m <nom>.",
  "La façon la plus courante dont un petit serveur meurt est un disque plein. df -h montre quel système de fichiers est à 100 %, du -sh /var/log/* | sort -h | tail trouve ce qui a grossi, et sur un hôte Docker, docker system df l'explique en général, car les caches de build et les images orphelines s'accumulent à chaque déploiement. docker system prune -a récupère cet espace, et le -a mérite d'être compris avant d'être tapé : il supprime toute image non utilisée par un conteneur en cours d'exécution, y compris la version précédente vers laquelle vous auriez voulu revenir.",
  "La deuxième plus courante est le tueur de processus par manque de mémoire, dont la signature est que vos journaux applicatifs ne disent rien du tout : le processus a été tué net, il n'a pas eu l'occasion de se plaindre. docker inspect --format '{{.State.OOMKilled}}' <nom> répond directement, et un code de sortie 137 dit la même chose dans la convention du shell, 128 plus le numéro de signal, 9 étant SIGKILL. La réponse est une limite de mémoire et un modèle plus petit, pas une politique de redémarrage qui transforme un plantage en boucle.",
  "Vérifiez ce que votre serveur expose réellement, car c'est là qu'un projet de loisir devient un incident. ss -ltnp liste chaque socket TCP en écoute avec le processus qui le détient. Tout ce qui est lié à 0.0.0.0 est joignable depuis internet si le pare-feu l'autorise, et docker run -p 5432:5432 publie sur toutes les interfaces par défaut — c'est ainsi que des bases de données étudiantes finissent trouvées par des scanners. Liez les services applicatifs à 127.0.0.1 derrière un reverse proxy, ou publiez explicitement, comme dans -p 127.0.0.1:5432:5432.",
  "Rendez les installations reproductibles avec un lockfile et une commande qui le respecte. npm ci n'est pas un npm install plus rapide : il exige un lockfile, supprime node_modules avant de commencer, n'écrit jamais dans package.json ni dans le lockfile, et sort en erreur si les deux divergent. C'est ce dernier comportement qui compte, car l'alternative résout silencieusement sur le serveur un arbre de dépendances différent de celui que vous avez testé. En Python, figez les versions dans requirements.txt au lieu d'y lister des noms nus, et reconstruisez l'environnement depuis ce fichier sur une machine vierge avant d'y croire.",
  "Deux détails font qu'un Dockerfile se tient bien. Copiez d'abord le manifeste et le lockfile, installez, puis copiez le source : placez COPY . . au-dessus de l'étape d'installation et un changement d'un seul caractère dans le source invalide la couche de dépendances, donc chaque build réinstalle tout. Et écrivez un .dockerignore contenant au minimum .git, node_modules et .env — le contexte de build est envoyé en entier au démon, donc sans lui vous téléversez tout votre historique à chaque build et, avec un COPY mal placé, vous cuisez vos secrets dans l'image.",
  "Commencez chaque script de déploiement par set -euo pipefail. Sans -e, une étape échouée est ignorée et le script annonce un succès par-dessus une application à moitié mise à jour ; sans -o pipefail, un échec au milieu d'un pipeline est masqué par le code de sortie de la dernière commande. Trois mots en tête de fichier transforment un déploiement partiel silencieux en arrêt visible.",
  "Laissez systemd posséder le processus. Une unité avec Restart=on-failure et RestartSec=5 relance le service après un plantage, et systemctl status myapp montre l'état et les dernières lignes de journal ensemble. Un piège : après avoir modifié un fichier d'unité, il faut lancer systemctl daemon-reload avant de redémarrer, sinon systemd continue d'exécuter l'ancienne définition et vous déboguez un changement qui n'a jamais été appliqué. Un autre : une politique de redémarrage placée devant une erreur de configuration produit un service qui bat indéfiniment tout en paraissant vivant dans un tableau de bord, alors lisez les journaux après l'avoir activée, pas à sa place.",
  "Gardez les secrets hors du dépôt, et comprenez ce que « hors » veut dire. .env appartient au .gitignore avant le premier commit. S'il est déjà commité, git rm --cached .env ne le retire que pour la suite : la valeur est dans l'historique, l'historique est dans chaque clone, et les dépôts publics sont scannés en continu par des gens qui cherchent exactement cela. La clé doit être renouvelée, et rien de ce que vous ferez au dépôt ne remplace cela.",
  "Terminez chaque déploiement par le même contrôle de dix minutes : appelez l'endpoint de santé avec curl et vérifiez qu'il annonce la version que vous venez de livrer, surveillez journalctl -u myapp -f pendant deux minutes, lancez df -h et free -h, et parcourez le chemin qui compte le plus pour un utilisateur. Ce sont les pannes silencieuses qui survivent — un endpoint qui renvoie 200 avec un corps vide ne vous réveillera jamais — et ce contrôle est l'endroit où vous l'attrapez plutôt qu'un utilisateur.",
  "L'intérêt n'est pas que ces commandes soient avancées. C'est que chacune remplace une supposition par une réponse, et que le temps gagné par une habitude opérationnelle est celui que vous passeriez sinon à redécouvrir, à minuit, laquelle de cinq causes possibles s'est produite."
];

const securityChecklistContent = [
  "Most student security advice is a list of nouns. This is a list of commands, and the first one takes ten seconds: run git log --all --oneline -S 'sk-' in your project. If it prints a commit, a key is in your history right now, and deleting the file did not remove it.",
  "That is worth proving rather than believing. Commit a file containing OPENAI_API_KEY=sk-proj-REDACTEDEXAMPLE123, then git rm it and commit again. The working tree is clean, ls shows nothing. But git log --all --oneline -S 'sk-proj-REDACTEDEXAMPLE123' -- .env still lists both commits, and git grep -n 'sk-proj' $(git rev-list --all) -- .env prints the key itself, prefixed with the commit it lives in. Anyone who has ever cloned the repository has that object. Rotating the key is the fix; rewriting history is cleanup, not remediation.",
  "The second command is a test you can run. Authentication tells you who is calling; it does not tell you what they may read. OWASP files this as API1:2023, Broken Object Level Authorization, and describes the attack as manipulating \"the ID of an object that is sent within the request\". Write a handler that looks up the record, compares record.owner to the authenticated caller, and returns 404 rather than 403 when they differ — a 403 confirms the row exists, which is itself a leak.",
  "Then assert it. A thirty-line script using only http.server and urllib can start the handler on 127.0.0.1, fire three requests — the owner reading their own row, a different user reading it, an anonymous caller reading it — and check the statuses are 200, 404, 404. Run it and it prints three PASS lines and exits 0; break the ownership comparison and the second case returns 200 and the script exits 1. OWASP's own prevention list ends with exactly this instruction: \"Write tests to evaluate the vulnerability of the authorization mechanism. Do not deploy changes that make the tests fail.\"",
  "Put a number on your body size limit, and look up what yours actually is, because the defaults disagree wildly. nginx caps request bodies at client_max_body_size 1m and answers 413 above it. Express is two orders of magnitude stricter: the limit option on express.json() \"defaults to '100kb'\". FastAPI and Starlette set no overall body limit at all — Starlette's maintainers resolved the request for one by saying it belongs in middleware you add yourself. So the same code behind nginx, behind Express, and served directly by Uvicorn has three different exposures, and only one of them is yours to configure.",
  "Treat any user text that reaches a prompt template as hostile, and do not expect the prompt to defend itself. OWASP's LLM01:2025 entry on prompt injection is blunt about the ceiling: \"Given the stochastic influence at the heart of the way models work, it is unclear if there are fool-proof methods of prevention for prompt injection.\" So cap the length, strip control characters, keep user text inside a delimited block, and put the authorisation decision in code rather than in a sentence asking the model to be careful.",
  "Rate limit everything public, per identity where you can and per address where you cannot. On an inference endpoint this is primarily a cost control, and the absence of it is how a free project becomes an unexpected invoice in an afternoon.",
  "Decide centrally what a log line and an error response may contain. A stack trace returned to the client describes your internals; a log line containing a token moves that token somewhere with weaker access control than where it started. Redact at the logging helper, not at each of the forty call sites.",
  "Make the dependency audit a gate rather than a habit. npm audit --audit-level=high sets, in npm's own words, \"the minimum level of vulnerability for npm audit to exit with a non-zero exit code\" — so putting that exact line in CI fails the build on a high or critical advisory and ignores the noise below it. Without the flag the default fails on any vulnerability at all, which is how teams learn to ignore the step.",
  "None of this has to arrive at once, but each item above is checkable in a single command, which is the point. A student project where those commands pass is already ahead of most of what is published on the public internet."
];

const securityChecklistContentFr = [
  "La plupart des conseils de sécurité destinés aux étudiants sont une liste de noms communs. Ceci est une liste de commandes, et la première prend dix secondes : lancez git log --all --oneline -S 'sk-' dans votre projet. Si elle affiche un commit, une clé se trouve dans votre historique en ce moment même, et supprimer le fichier ne l'a pas enlevée.",
  "Cela vaut la peine d'être prouvé plutôt que cru. Commitez un fichier contenant OPENAI_API_KEY=sk-proj-REDACTEDEXAMPLE123, puis faites git rm dessus et commitez à nouveau. L'arbre de travail est propre, ls ne montre rien. Mais git log --all --oneline -S 'sk-proj-REDACTEDEXAMPLE123' -- .env liste toujours les deux commits, et git grep -n 'sk-proj' $(git rev-list --all) -- .env affiche la clé elle-même, préfixée par le commit qui la contient. Quiconque a déjà cloné le dépôt possède cet objet. Faire tourner la clé est le correctif ; réécrire l'historique est du nettoyage, pas une remédiation.",
  "La deuxième commande est un test que vous pouvez exécuter. L'authentification dit qui appelle ; elle ne dit pas ce que l'appelant a le droit de lire. L'OWASP classe cela en API1:2023, Broken Object Level Authorization, et décrit l'attaque comme la manipulation de « l'identifiant d'un objet envoyé dans la requête ». Écrivez un gestionnaire qui charge l'enregistrement, compare record.owner à l'appelant authentifié, et renvoie 404 plutôt que 403 en cas de différence — un 403 confirme que la ligne existe, ce qui est déjà une fuite.",
  "Puis vérifiez-le. Un script d'une trentaine de lignes n'utilisant que http.server et urllib peut démarrer le gestionnaire sur 127.0.0.1, envoyer trois requêtes — le propriétaire qui lit sa propre ligne, un autre utilisateur qui la lit, un appelant anonyme qui la lit — et contrôler que les statuts sont 200, 404, 404. Lancez-le : il affiche trois lignes PASS et sort avec le code 0 ; cassez la comparaison de propriété et le deuxième cas renvoie 200 et le script sort avec 1. La liste de prévention de l'OWASP se termine précisément par cette consigne : « Écrivez des tests pour évaluer la vulnérabilité du mécanisme d'autorisation. Ne déployez pas de changements qui font échouer ces tests. »",
  "Mettez un chiffre sur votre limite de taille de corps de requête, et allez vérifier laquelle s'applique chez vous, car les valeurs par défaut divergent énormément. nginx plafonne les corps de requête à client_max_body_size 1m et répond 413 au-delà. Express est deux ordres de grandeur plus strict : l'option limit d'express.json() « vaut par défaut '100kb' ». FastAPI et Starlette n'imposent aucune limite globale de corps — les mainteneurs de Starlette ont tranché la demande en répondant que cela relève d'un middleware que vous ajoutez vous-même. Le même code derrière nginx, derrière Express, et servi directement par Uvicorn présente donc trois expositions différentes, et une seule d'entre elles vous appartient.",
  "Considérez comme hostile tout texte utilisateur qui atteint un template de prompt, et n'attendez pas du prompt qu'il se défende seul. L'entrée LLM01:2025 de l'OWASP sur l'injection de prompt est nette sur le plafond atteignable : « Compte tenu de l'influence stochastique au cœur du fonctionnement des modèles, il n'est pas certain qu'il existe des méthodes de prévention infaillibles contre l'injection de prompt. » Plafonnez donc la longueur, retirez les caractères de contrôle, gardez le texte utilisateur dans un bloc délimité, et placez la décision d'autorisation dans le code plutôt que dans une phrase demandant au modèle d'être prudent.",
  "Limitez le débit de tout ce qui est public, par identité quand c'est possible et par adresse sinon. Sur un endpoint d'inférence, c'est d'abord un contrôle de coût, et son absence est la façon dont un projet gratuit devient une facture inattendue en un après-midi.",
  "Décidez de façon centralisée ce qu'une ligne de journal et une réponse d'erreur ont le droit de contenir. Une trace d'exécution renvoyée au client décrit vos entrailles ; une ligne de journal contenant un jeton déplace ce jeton vers un endroit moins bien protégé que son origine. Masquez dans la fonction de journalisation, pas dans chacun des quarante appels.",
  "Faites de l'audit de dépendances une barrière plutôt qu'une habitude. npm audit --audit-level=high définit, selon les termes de npm, « le niveau minimal de vulnérabilité pour que npm audit sorte avec un code de retour non nul » — placer cette ligne exacte dans la CI fait donc échouer le build sur une alerte high ou critical et ignore le bruit en dessous. Sans ce drapeau, le comportement par défaut échoue sur n'importe quelle vulnérabilité, ce qui est la façon dont les équipes apprennent à ignorer l'étape.",
  "Rien de tout cela n'a besoin d'arriver d'un coup, mais chaque point ci-dessus se vérifie en une seule commande, et c'est bien l'objectif. Un projet étudiant où ces commandes passent est déjà devant l'essentiel de ce qui est publié sur l'internet public."
];

const databaseDesignContent = [
  "The schema decision that costs you most is not which database you picked. It is that your ownership column is missing and your ingestion is not idempotent, and both of those are measurable in a terminal in under a minute.",
  "Start with the index question, because it is the one students argue about without data. Build a 200,000-row table in memory, spread over about 100 distinct owner_id values, and query it by a column with no index: sqlite reports SCAN chunks in EXPLAIN QUERY PLAN and takes about 8.1 ms per query, averaged over 50 runs. Add CREATE INDEX i ON chunks(owner_id), run ANALYZE, and the same query reports SEARCH chunks USING COVERING INDEX i (owner_id=?) and takes about 0.55 ms. That is roughly fifteen times faster on a table small enough to fit in RAM, and the plan line is what tells you which one you got. The ratio depends on how many distinct owner_id values you spread the rows over: with a thousand owners rather than a hundred, the indexed query falls below 0.1 ms and the gap widens further.",
  "Learn to read that plan output on the database you actually ship. In PostgreSQL the equivalent is EXPLAIN (ANALYZE, BUFFERS) SELECT …, and the ANALYZE option, per the PostgreSQL manual, \"causes the statement to be actually executed, not only planned\" — so wrap it in BEGIN; … ROLLBACK; if the statement writes. Reading the plan is the difference between adding an index and guessing at one.",
  "Model the core entities before thinking about embeddings at all. Users, projects, documents, jobs, evaluations — each with a primary key, an explicit owner column, and created and updated timestamps. That owner column is what the authorisation check in the previous article reads; a row that cannot say who it belongs to turns every permission check into a join nobody planned for.",
  "For retrieval, one table holds the chunk text, its embedding, the source document id and the chunk's position in that document. With pgvector the column is declared as embedding vector(1536) and cosine distance is the <=> operator, so the query is ORDER BY embedding <=> $1 LIMIT 5 and the matching index is CREATE INDEX ON chunks USING hnsw (embedding vector_cosine_ops). Check your dimensions against the limit before you design around it: pgvector indexes the vector type up to 2,000 dimensions, while an unindexed vector column goes to 16,000.",
  "Store which model produced each vector, in a plain text column next to it. You will change embedding models, and without that column an upgrade means either re-embedding everything blindly or silently mixing two incompatible vector spaces. The second failure throws no error — retrieval quality just degrades, and nothing in your logs says why.",
  "Make ingestion idempotent, and prove it by running it twice. Declare UNIQUE (document_id, chunk_index) and insert three chunks with a plain INSERT, twice: SELECT count(*) returns 6. Do the same through INSERT … ON CONFLICT (document_id, chunk_index) DO UPDATE SET body = excluded.body and it returns 3. SQLite documents that form as UPSERT, and PostgreSQL uses the identical ON CONFLICT clause. Pipelines are re-run — a job fails halfway, someone triggers it twice, a retry fires — and the version that duplicates degrades retrieval a little more each time.",
  "Keep operational logs append-only and separate, with a retention window chosen before the table is large. Telemetry grows faster than everything else and competes for exactly the resources your user-facing queries need.",
  "Write down what the schema means: each table, what owns what, and which query each index exists for. A schema whose indexes have no stated purpose is one nobody will dare delete from, which is how tables end up indexed on every column."
];

const databaseDesignContentFr = [
  "La décision de schéma qui vous coûte le plus cher n'est pas le choix de la base de données. C'est l'absence de colonne de propriété et une ingestion non idempotente — et les deux se mesurent dans un terminal en moins d'une minute.",
  "Commencez par la question des index, celle dont les étudiants débattent sans données. Construisez une table de 200 000 lignes en mémoire, réparties sur une centaine de valeurs distinctes d'owner_id, et interrogez-la sur une colonne sans index : sqlite affiche SCAN chunks dans EXPLAIN QUERY PLAN et met environ 8,1 ms par requête, en moyenne sur 50 exécutions. Ajoutez CREATE INDEX i ON chunks(owner_id), lancez ANALYZE, et la même requête affiche SEARCH chunks USING COVERING INDEX i (owner_id=?) en environ 0,55 ms. Soit à peu près quinze fois plus rapide sur une table assez petite pour tenir en RAM — et c'est la ligne de plan qui vous dit laquelle des deux vous avez obtenue. Le rapport dépend du nombre de valeurs distinctes d'owner_id sur lesquelles vous répartissez les lignes : avec un millier de propriétaires plutôt qu'une centaine, la requête indexée passe sous 0,1 ms et l'écart se creuse encore.",
  "Apprenez à lire cette sortie de plan sur la base que vous déployez réellement. En PostgreSQL l'équivalent est EXPLAIN (ANALYZE, BUFFERS) SELECT …, et l'option ANALYZE, selon le manuel PostgreSQL, « provoque l'exécution réelle de l'instruction, et pas seulement sa planification » — encadrez-la donc par BEGIN; … ROLLBACK; si l'instruction écrit. Lire le plan, c'est la différence entre ajouter un index et en deviner un.",
  "Modélisez les entités principales avant même de penser aux embeddings. Utilisateurs, projets, documents, traitements, évaluations : chacun avec une clé primaire, une colonne de propriétaire explicite, et des horodatages de création et de mise à jour. C'est cette colonne de propriétaire que lit le contrôle d'autorisation de l'article précédent ; une ligne incapable de dire à qui elle appartient transforme chaque contrôle de permission en jointure non prévue.",
  "Pour la recherche, une table contient le texte du fragment, son embedding, l'identifiant du document source et la position du fragment dans ce document. Avec pgvector, la colonne se déclare embedding vector(1536) et la distance cosinus est l'opérateur <=>, donc la requête s'écrit ORDER BY embedding <=> $1 LIMIT 5 et l'index correspondant est CREATE INDEX ON chunks USING hnsw (embedding vector_cosine_ops). Vérifiez vos dimensions avant de concevoir autour : pgvector indexe le type vector jusqu'à 2 000 dimensions, tandis qu'une colonne vector non indexée va jusqu'à 16 000.",
  "Stockez quel modèle a produit chaque vecteur, dans une simple colonne texte à côté. Vous changerez de modèle d'embedding, et sans cette colonne une montée de version signifie soit tout réencoder à l'aveugle, soit mélanger silencieusement deux espaces vectoriels incompatibles. La seconde panne ne lève aucune erreur : la qualité de recherche se dégrade, et rien dans vos journaux n'en donne la raison.",
  "Rendez l'ingestion idempotente, et prouvez-le en la lançant deux fois. Déclarez UNIQUE (document_id, chunk_index) et insérez trois fragments avec un INSERT ordinaire, deux fois : SELECT count(*) renvoie 6. Faites la même chose avec INSERT … ON CONFLICT (document_id, chunk_index) DO UPDATE SET body = excluded.body et il renvoie 3. SQLite documente cette forme sous le nom d'UPSERT, et PostgreSQL utilise la même clause ON CONFLICT. Les pipelines sont relancés — un traitement échoue à mi-parcours, quelqu'un le déclenche deux fois, une nouvelle tentative part — et la version qui duplique dégrade la recherche un peu plus à chaque accident.",
  "Gardez les journaux d'exploitation en ajout seul et séparés, avec une durée de conservation choisie avant que la table soit énorme. La télémétrie croît plus vite que tout le reste et concurrence exactement les ressources dont vos requêtes utilisateur ont besoin.",
  "Écrivez ce que le schéma signifie : chaque table, ce qui appartient à quoi, et pour quelle requête chaque index existe. Un schéma dont les index n'ont pas de raison d'être écrite est un schéma dans lequel personne n'osera supprimer quoi que ce soit — c'est ainsi qu'on finit avec des tables indexées sur toutes les colonnes."
];

const cicdContent = [
  "Here is a complete pipeline, and it is short enough to read in one screen. Create .github/workflows/ci.yml with name: ci, an on: block triggering on push to main and on pull_request, a workflow-level permissions: with contents: read, a concurrency: block, and one job that checks out, installs, and runs your four checks. Everything below explains why each of those keys is there.",
  "The four mandatory steps are lint, typecheck, test, build, in that order, because that is increasing order of cost. A lint failure comes back in seconds; a build failure takes minutes. Ordering them cheapest-first is free and it is the difference between a five-second answer and a five-minute one on the most common mistake.",
  "Pin the actions by major version and check what that version currently is, because stale pins are the most common reason a student workflow fails on a runner it used to pass on. As of this writing the current majors are actions/checkout@v7, actions/setup-node@v7, actions/setup-python@v7 and actions/cache@v6 — the releases page of each repository is the source, and it changes.",
  "Add concurrency: with group: ci-${{ github.ref }} and cancel-in-progress: true. Without it, pushing three times to a branch queues three full runs and you wait for all of them; with it, GitHub cancels the superseded runs. This is the single highest-value four lines in the file, and both key names are exactly as the workflow syntax reference spells them.",
  "Set timeout-minutes on the job. The documented default is 360 — six hours — so a hung test does not fail your pipeline, it occupies a runner for the rest of the afternoon. Ten is a generous ceiling for a student project and turns a hang into a red check.",
  "Turn on branch protection, because a pipeline nobody has to pass is decoration. Requiring checks to be green before merge is what converts the pipeline from advice into a constraint, and it is the single setting that most distinguishes a repository that stays working from one that slowly rots.",
  "Know what the pipeline costs before it surprises you. GitHub's billing documentation states that Actions usage \"is free for self-hosted runners and for public repositories that use standard GitHub-hosted runners\" — so an open-source student project pays nothing. A private repository on GitHub Free gets 2,000 standard-runner minutes and 500 MB of artifact storage per month, which is the number to watch if your repo is private and your matrix is wide.",
  "Be careful with strategy.matrix, because fail-fast defaults to true: one failing combination cancels the rest, so you learn that Node 20 broke without learning whether Node 22 also broke. Set fail-fast: false when you want the full picture and leave it alone when you want the fast answer.",
  "Run a smoke test after deploy rather than assuming a successful deploy means a working service. Hit the health endpoint and one real route and assert the response body, not just the status — a platform only knows whether the process started, and a process that starts while its database URL is wrong starts perfectly.",
  "Treat database migrations as the dangerous part, because they are the part that is hard to reverse. Deploy a migration that is compatible with both the old and the new code, then the code, then the cleanup — three releases rather than one. The version that drops a column in the same release that stops using it has no rollback, because rolling the code back does not bring the column back.",
  "Keep the whole thing under five minutes and it gets used on every commit. Cache dependencies with the cache: npm option on setup-node rather than a separate cache step, run independent jobs in parallel, and move any slow check that rarely catches anything to a nightly schedule."
];

const cicdContentFr = [
  "Voici un pipeline complet, assez court pour tenir sur un écran. Créez .github/workflows/ci.yml avec name: ci, un bloc on: déclenché sur push vers main et sur pull_request, un permissions: au niveau du workflow avec contents: read, un bloc concurrency:, et un seul job qui récupère le code, installe les dépendances et lance vos quatre vérifications. Tout ce qui suit explique pourquoi chacune de ces clés est là.",
  "Les quatre étapes obligatoires sont lint, vérification de types, tests, build, dans cet ordre, parce que c'est l'ordre de coût croissant. Un échec de lint revient en quelques secondes ; un échec de build prend des minutes. Les ordonner du moins cher au plus cher est gratuit, et c'est la différence entre une réponse en cinq secondes et une réponse en cinq minutes sur l'erreur la plus fréquente.",
  "Épinglez les actions par version majeure et vérifiez quelle est cette version aujourd'hui, car les épinglages périmés sont la première cause d'échec d'un workflow étudiant sur un runner qui le passait auparavant. À l'heure où ces lignes sont écrites, les majeures courantes sont actions/checkout@v7, actions/setup-node@v7, actions/setup-python@v7 et actions/cache@v6 — la page des releases de chaque dépôt fait foi, et cela change.",
  "Ajoutez concurrency: avec group: ci-${{ github.ref }} et cancel-in-progress: true. Sans cela, pousser trois fois sur une branche met trois exécutions complètes en file et vous les attendez toutes ; avec cela, GitHub annule les exécutions rendues obsolètes. Ce sont les quatre lignes les plus rentables du fichier, et les deux noms de clés s'écrivent exactement comme dans la référence de syntaxe des workflows.",
  "Définissez timeout-minutes sur le job. La valeur par défaut documentée est 360 — six heures — donc un test bloqué ne fait pas échouer votre pipeline, il occupe un runner pour le reste de l'après-midi. Dix minutes est un plafond généreux pour un projet étudiant et transforme un blocage en croix rouge.",
  "Activez la protection de branche, car un pipeline que personne n'est obligé de passer n'est qu'une décoration. Exiger des contrôles au vert avant fusion transforme le pipeline d'un conseil en une contrainte, et c'est le réglage qui distingue le plus un dépôt qui reste fonctionnel d'un dépôt qui pourrit lentement.",
  "Sachez ce que coûte le pipeline avant qu'il ne vous surprenne. La documentation de facturation de GitHub indique que l'usage d'Actions « est gratuit pour les runners auto-hébergés et pour les dépôts publics utilisant les runners standard hébergés par GitHub » — un projet étudiant open source ne paie donc rien. Un dépôt privé sur l'offre GitHub Free dispose de 2 000 minutes de runner standard et de 500 Mo de stockage d'artefacts par mois : c'est le chiffre à surveiller si votre dépôt est privé et votre matrice large.",
  "Attention à strategy.matrix, car fail-fast vaut true par défaut : une combinaison en échec annule les autres, et vous apprenez que Node 20 est cassé sans apprendre si Node 22 l'est aussi. Mettez fail-fast: false quand vous voulez la vue d'ensemble, et laissez la valeur par défaut quand vous voulez la réponse rapide.",
  "Lancez un test de fumée après déploiement plutôt que de supposer qu'un déploiement réussi signifie un service fonctionnel. Appelez l'endpoint de santé et une vraie route, et vérifiez le corps de la réponse, pas seulement le statut — une plateforme sait seulement que le processus a démarré, et un processus dont l'URL de base de données est fausse démarre parfaitement.",
  "Traitez les migrations de base comme la partie dangereuse, parce que c'est celle qu'on inverse mal. Déployez une migration compatible avec l'ancien et le nouveau code, puis le code, puis le nettoyage : trois livraisons plutôt qu'une. La version qui supprime une colonne dans la même livraison que le code qui cesse de l'utiliser n'a aucun retour arrière, car revenir au code précédent ne fait pas revenir la colonne.",
  "Gardez l'ensemble sous cinq minutes et il sera utilisé à chaque commit. Mettez les dépendances en cache avec l'option cache: npm de setup-node plutôt qu'avec une étape de cache séparée, parallélisez les jobs indépendants, et déplacez vers une exécution nocturne tout contrôle lent qui n'attrape presque rien."
];

const observabilityContent = [
  "Start with the number that makes the case. Take 1,000 request timings where 990 are around 40 ms and 10 are around 3 seconds — a 1% cache miss, nothing exotic. Python's statistics module gives mean 69.0 ms, p50 40.5 ms, p95 53.5 ms, p99 88.3 ms, max 2996.3 ms. Look at that again: the mean is higher than the ninety-fifth percentile. An average is not a summary of this distribution, it is a number dragged around by the tail, and it is the number most student dashboards show.",
  "So track percentiles, and track them as percentiles rather than as an average of percentiles. If you use Prometheus, the histogram is the mechanism: instrument with a _bucket metric and query histogram_quantile(0.9, rate(http_request_duration_seconds_bucket[10m])), which is the documented example form — the first argument is a float between 0 and 1, and the rate() is over the bucket series, not the total.",
  "The minimum useful set is latency percentiles, error rate, throughput, queue depth, and dependency failures. Four of those five are cheap counters. The one people skip is queue depth, and it is the one that tells you an outage is coming rather than that it arrived.",
  "Put a correlation ID on every request at the edge and pass it downstream. There is already a standard for this so you do not have to invent a header: W3C Trace Context defines traceparent, formatted as four dash-separated fields — version, a 32-hex-digit trace-id, a 16-hex-digit parent-id, and 2 hex digits of flags, as in 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01. Accept it if present, generate it if not, and log it on every line.",
  "Log structured records, and make the redaction structural rather than remembered. A ~25-line JsonFormatter subclass of logging.Formatter that emits json.dumps of level, message, a request_id read from a contextvars.ContextVar, and whatever fields the call site passed in extra, while replacing any key in a redaction set with \"[redacted]\", produces lines like {\"level\": \"INFO\", \"msg\": \"request finished\", \"request_id\": \"40b4c658\", \"route\": \"/v1/answer\", \"status\": 200, \"duration_ms\": 412, \"api_key\": \"[redacted]\"}. The point is the last field: the call site passed the real key, and the formatter stopped it. Redaction you have to remember at every call site is redaction that fails once.",
  "Use contextvars rather than a global for the request id, because it is the version that survives concurrency. A module-level variable gets overwritten by whichever request ran last, which produces logs that are worse than none — they are confidently attributed to the wrong request.",
  "Alert only on conditions where a human should do something now. An alert that fires and is routinely ignored is worse than no alert, because it trains you to ignore the next one, which will be the real incident. A good filter: if the runbook for this alert is \"wait and see\", it is a dashboard line, not a page.",
  "Look at the dashboard when nothing is wrong. Knowing what normal looks like is the whole mechanism by which abnormal becomes obvious, and it is the difference between noticing a slow degradation and hearing about it from a user.",
  "For a portfolio project this is disproportionately visible, because it is checkable. A reviewer can open your repository, find the traceparent handling and the percentile query, and see production engineering in about ninety seconds — which is roughly how long they have."
];

const observabilityContentFr = [
  "Commencez par le chiffre qui emporte l'argument. Prenez 1 000 temps de requête dont 990 tournent autour de 40 ms et 10 autour de 3 secondes — un défaut de cache à 1 %, rien d'exotique. Le module statistics de Python donne : moyenne 69,0 ms, p50 40,5 ms, p95 53,5 ms, p99 88,3 ms, max 2996,3 ms. Relisez : la moyenne est supérieure au quatre-vingt-quinzième centile. Une moyenne n'est pas un résumé de cette distribution, c'est un chiffre tiré par la queue de distribution — et c'est celui qu'affichent la plupart des tableaux de bord étudiants.",
  "Suivez donc des centiles, et suivez-les comme des centiles plutôt que comme une moyenne de centiles. Avec Prometheus, l'histogramme est le mécanisme : instrumentez avec une métrique _bucket et interrogez histogram_quantile(0.9, rate(http_request_duration_seconds_bucket[10m])), qui est la forme donnée en exemple dans la documentation — le premier argument est un flottant entre 0 et 1, et le rate() porte sur la série de buckets, pas sur le total.",
  "L'ensemble minimal utile : centiles de latence, taux d'erreur, débit, profondeur de file, échecs de dépendances. Quatre de ces cinq sont de simples compteurs. Celui que l'on saute est la profondeur de file, et c'est justement celui qui annonce une panne au lieu de la constater.",
  "Posez un identifiant de corrélation sur chaque requête en bordure et transmettez-le en aval. Un standard existe déjà, inutile d'inventer un en-tête : W3C Trace Context définit traceparent, composé de quatre champs séparés par des tirets — la version, un trace-id de 32 chiffres hexadécimaux, un parent-id de 16 chiffres hexadécimaux, et 2 chiffres hexadécimaux d'indicateurs, comme dans 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01. Acceptez-le s'il est présent, générez-le sinon, et journalisez-le sur chaque ligne.",
  "Journalisez des enregistrements structurés, et rendez le masquage structurel plutôt que mémorisé. Une sous-classe JsonFormatter de logging.Formatter d'environ 25 lignes, qui émet un json.dumps du niveau, du message, d'un request_id lu dans un contextvars.ContextVar et des champs passés par l'appelant via extra, tout en remplaçant toute clé figurant dans un ensemble à masquer par « [redacted] », produit des lignes comme {\"level\": \"INFO\", \"msg\": \"request finished\", \"request_id\": \"40b4c658\", \"route\": \"/v1/answer\", \"status\": 200, \"duration_ms\": 412, \"api_key\": \"[redacted]\"}. Tout est dans le dernier champ : l'appelant a bien passé la vraie clé, et c'est le formateur qui l'a arrêtée. Un masquage qu'il faut penser à chaque appel est un masquage qui échouera une fois.",
  "Utilisez contextvars plutôt qu'une variable globale pour l'identifiant de requête, car c'est la version qui survit à la concurrence. Une variable de module est écrasée par la dernière requête en date, ce qui produit des journaux pires que rien : ils sont attribués avec assurance à la mauvaise requête.",
  "N'alertez que sur des conditions où un humain doit agir maintenant. Une alerte qui se déclenche et que l'on ignore systématiquement est pire que pas d'alerte, car elle vous entraîne à ignorer la suivante — qui sera le vrai incident. Un bon filtre : si la procédure associée à l'alerte est « attendre et voir », c'est une ligne de tableau de bord, pas une astreinte.",
  "Regardez le tableau de bord quand tout va bien. Savoir à quoi ressemble la normale est tout le mécanisme par lequel l'anormal devient évident, et c'est la différence entre remarquer une dégradation lente et l'apprendre d'un utilisateur.",
  "Pour un projet de portfolio, cela se voit de façon disproportionnée, parce que c'est vérifiable. Un recruteur peut ouvrir votre dépôt, y trouver la gestion de traceparent et la requête de centiles, et voir de l'ingénierie de production en quatre-vingt-dix secondes environ — soit à peu près le temps dont il dispose."
];

const networkingBasicsContent = [
  "One command settles the argument about where your two seconds went. Run curl -sS -o /dev/null -w 'conns %{num_connects} dns %{time_namelookup} tls %{time_appconnect} ttfb %{time_starttransfer} total %{time_total}\\n' https://api.github.com/zen and read the breakdown. On the machine this was written on: dns 0.014, tls 0.129, ttfb 0.186, total 0.186. The model had not been called yet. Two-thirds of that request was handshake.",
  "Now pass the same URL twice in one curl invocation and watch what happens. The first line reports conns 1 with tls 0.129 and total 0.186; the second reports conns 0, tls 0.000000 and total 0.057. Same server, same bytes, a third of the time — because the second request reused the open connection and skipped the TLS handshake entirely. That zero is the whole lesson.",
  "The same effect in your application code is one object. Measured over five requests each, requests.get(url) in a loop took about 226 ms per request; the identical calls through a single requests.Session() settled at about 60 ms once the first call had opened the connection, which still pays the full setup cost. A client constructed inside your request handler is the loop version, and it is an easy mistake to make because it looks tidier.",
  "The four things worth understanding properly are DNS, TCP, HTTP semantics, and TLS, and the curl output above names three of them as separate line items. DNS because a cold lookup adds latency and a stale cache causes failures that look random. TCP because connection setup costs a round trip. HTTP because its semantics govern what is safe to retry. TLS because the handshake is the expensive part and reusing it is most of the win.",
  "Give every external call an explicit timeout, because the default is not a number, it is forever. The requests documentation states it plainly: \"If no timeout is specified explicitly, requests do not time out\", and recommends the parameter for \"nearly all requests\" because omitting it \"can cause your program to hang indefinitely\". Pass timeout=(3, 10) to separate the connect budget from the read budget, and make the budgets add up: a handler with a two-second target cannot make three sequential calls that each wait ten seconds.",
  "Retries are where well-meaning code causes incidents. Retrying immediately turns a struggling service into an overwhelmed one; exponential backoff with jitter spreads the load instead of synchronising it. Retry only what is safe to retry — a GET is naturally safe, a POST is not unless you have made it idempotent with a key the server uses to recognise a duplicate.",
  "Payload size interacts with all of the above. Compression is usually worth it for text-heavy responses and usually not for small ones, where the compression cost exceeds the transfer saving. The more useful discipline is simply not returning fields nobody reads.",
  "Record the same four timings from the curl output for your own outbound calls — namelookup, connect, appconnect, starttransfer — and log them with the dependency name. The first time a dependency degrades, this turns a vague report of slowness into a specific answer, and it costs almost nothing to add in advance.",
  "None of this is exotic knowledge, which is exactly why it separates engineers. Model quality is where the attention goes; that 0.129 seconds of handshake is where the latency was."
];

const networkingBasicsContentFr = [
  "Une seule commande tranche le débat sur la destination de vos deux secondes. Lancez curl -sS -o /dev/null -w 'conns %{num_connects} dns %{time_namelookup} tls %{time_appconnect} ttfb %{time_starttransfer} total %{time_total}\\n' https://api.github.com/zen et lisez la décomposition. Sur la machine où ces lignes ont été écrites : dns 0,014, tls 0,129, ttfb 0,186, total 0,186. Le modèle n'avait pas encore été appelé. Deux tiers de cette requête étaient de la poignée de main.",
  "Passez maintenant la même URL deux fois dans un seul appel à curl et observez. La première ligne indique conns 1 avec tls 0,129 et total 0,186 ; la seconde indique conns 0, tls 0,000000 et total 0,057. Même serveur, mêmes octets, un tiers du temps — parce que la seconde requête a réutilisé la connexion ouverte et sauté entièrement la poignée de main TLS. Ce zéro est toute la leçon.",
  "Le même effet dans votre code applicatif tient en un objet. Mesuré sur cinq requêtes chacune, requests.get(url) dans une boucle prenait environ 226 ms par requête ; les mêmes appels via un unique requests.Session() se stabilisaient autour de 60 ms une fois la connexion ouverte par le premier appel, qui paie lui toujours le coût complet d'établissement. Un client construit à l'intérieur de votre gestionnaire de requête, c'est la version en boucle — et l'erreur est facile à commettre, parce qu'elle a l'air plus propre.",
  "Les quatre notions à maîtriser sont le DNS, TCP, la sémantique HTTP et TLS, et la sortie de curl ci-dessus en nomme trois comme postes distincts. Le DNS parce qu'une résolution à froid ajoute de la latence et qu'un cache périmé provoque des pannes qui semblent aléatoires. TCP parce que l'établissement d'une connexion coûte un aller-retour. HTTP parce que sa sémantique détermine ce qu'il est sûr de réessayer. TLS parce que la poignée de main est la partie chère et que la réutiliser constitue l'essentiel du gain.",
  "Donnez à chaque appel externe un délai explicite, car la valeur par défaut n'est pas un nombre : c'est l'infini. La documentation de requests le dit sans détour : « si aucun délai n'est spécifié explicitement, les requêtes n'expirent pas », et recommande ce paramètre pour « la quasi-totalité des requêtes » parce que l'omettre « peut faire que votre programme se bloque indéfiniment ». Passez timeout=(3, 10) pour séparer le budget de connexion du budget de lecture, et faites en sorte que les budgets s'additionnent : un gestionnaire visant deux secondes ne peut pas enchaîner trois appels qui attendent chacun dix secondes.",
  "C'est sur les tentatives que du code bien intentionné provoque des incidents. Réessayer immédiatement transforme un service en difficulté en service submergé ; un délai exponentiel avec variation aléatoire répartit la charge au lieu de la synchroniser. Ne réessayez que ce qui peut l'être : un GET l'est naturellement, un POST ne l'est que si vous l'avez rendu idempotent avec une clé que le serveur utilise pour reconnaître un doublon.",
  "La taille des charges utiles interagit avec tout ce qui précède. La compression vaut généralement le coup pour des réponses riches en texte, rarement pour les petites, où son coût dépasse le gain de transfert. La discipline la plus utile reste simplement de ne pas renvoyer des champs que personne ne lit.",
  "Enregistrez pour vos propres appels sortants les quatre mêmes temps que ceux affichés par curl — namelookup, connect, appconnect, starttransfer — et journalisez-les avec le nom de la dépendance. La première fois qu'une dépendance se dégrade, cela transforme un vague signalement de lenteur en réponse précise, pour un coût quasi nul si c'est préparé.",
  "Rien de tout cela n'est ésotérique, et c'est précisément pourquoi cela distingue les ingénieurs. La qualité du modèle attire l'attention ; ces 0,129 seconde de poignée de main sont l'endroit où était la latence."
];

const operatingSystemsSkillsContent = [
  "Every deploy, your service drops the requests that were in flight. That is not a framework bug and it is fixable in about eight lines, but only if you know which signal arrives and when.",
  "The sequence is documented and worth memorising. docker stop sends SIGTERM — \"if no signal is configured for the container, SIGTERM is used as default\" — then waits, and the daemon's default wait \"is 10 seconds for Linux containers\", after which the process is killed with SIGKILL. systemd does the same thing: SIGTERM first, then SIGKILL once TimeoutStopSec= expires. You get a grace period whether or not you use it.",
  "Using it is a signal handler and a flag. Register signal.signal(signal.SIGTERM, handler) where the handler sets shutting_down = True; loop while not shutting_down, doing one unit of work per pass. Run it, send kill -TERM to the pid, and the process prints that it received signal 15, finishes the request it was holding, and exits 0. Python installs no handler for SIGTERM the way it does for SIGINT, so without that one line the default disposition terminates the process immediately, mid-request, on every single release.",
  "File descriptors are the failure that looks like nothing and then looks like everything. Every socket, open file, and database connection consumes one. You can reproduce the ending in a few lines: read the soft limit with resource.getrlimit(resource.RLIMIT_NOFILE), lower it to 64 with setrlimit to make the failure fast, then open files in a loop without closing them. It opens 61 and then raises [Errno 24] Too many open files. Note what the error says — it names the limit, not the leak, which is why this is usually misdiagnosed as \"we need a bigger limit\".",
  "Virtual memory is the concept that matters most for inference workloads, because the process that gets killed leaves nothing in your application logs. On Linux the kernel keeps the record elsewhere: a cgroup's memory.max is \"the main mechanism to limit memory usage\", and when usage reaches it \"and can't be reduced, the OOM killer is invoked in the cgroup\". The count lands in memory.events as oom_kill, \"the number of processes belonging to this cgroup killed by any kind of OOM killer\". If your container restarts with no traceback, read that file before reading your code.",
  "Set the limit deliberately, with docker run --memory (or -m), whose minimum is 6M. Unbounded is not a safe default, it is an unexamined one: it means the first workload to misbehave takes the whole host down rather than only itself. A container with a limit fails predictably, in one place, with a counter that says so.",
  "Declare the restart policy too, because it is not on by default. systemd's Restart= is documented as: \"if set to no (the default), the service will not be restarted\". Restart=on-failure restarts on a non-zero exit or a fatal signal. A service that crashes once at 3am and stays down until morning is almost always a service where nobody set this line.",
  "Before blaming the framework, spend two minutes outside the process: CPU, memory, disk, and open sockets. Is it actually saturating a core, is it swapping, are connections piling up in a waiting state. This frequently ends the investigation, because the answer is visible from outside the code people are staring at.",
  "The reason this literacy pays is that it changes the category of the problem. Without it, an outage is an unexplained event you wait out. With it, it is three or four specific questions, each with a file or a command that answers it."
];

const operatingSystemsSkillsContentFr = [
  "À chaque déploiement, votre service perd les requêtes en cours. Ce n'est pas un bug du framework et cela se corrige en huit lignes environ — mais seulement si vous savez quel signal arrive, et quand.",
  "La séquence est documentée et mérite d'être retenue. docker stop envoie SIGTERM — « si aucun signal n'est configuré pour le conteneur, SIGTERM est utilisé par défaut » — puis attend, et l'attente par défaut du démon « est de 10 secondes pour les conteneurs Linux », après quoi le processus est tué par SIGKILL. systemd fait la même chose : SIGTERM d'abord, puis SIGKILL une fois TimeoutStopSec= expiré. Vous disposez d'un délai de grâce, que vous l'utilisiez ou non.",
  "L'utiliser tient en un gestionnaire de signal et un drapeau. Enregistrez signal.signal(signal.SIGTERM, handler) où le gestionnaire met shutting_down = True ; bouclez tant que shutting_down est faux, en traitant une unité de travail par passage. Lancez-le, envoyez kill -TERM au pid : le processus affiche qu'il a reçu le signal 15, termine la requête qu'il tenait, et sort avec le code 0. Python n'installe aucun gestionnaire pour SIGTERM comme il le fait pour SIGINT : sans cette unique ligne, la disposition par défaut arrête donc le processus immédiatement, en pleine requête, à chaque mise en production.",
  "Les descripteurs de fichiers sont la panne qui ne ressemble à rien, puis à tout. Chaque socket, chaque fichier ouvert, chaque connexion à une base en consomme un. Vous pouvez en reproduire la fin en quelques lignes : lisez la limite souple avec resource.getrlimit(resource.RLIMIT_NOFILE), abaissez-la à 64 avec setrlimit pour que la panne arrive vite, puis ouvrez des fichiers en boucle sans les fermer. Il en ouvre 61, puis lève [Errno 24] Too many open files. Remarquez ce que dit l'erreur : elle nomme la limite, pas la fuite — c'est pourquoi on la diagnostique généralement à tort comme « il nous faut une limite plus haute ».",
  "La mémoire virtuelle est la notion la plus importante pour l'inférence, car le processus tué ne laisse rien dans vos journaux applicatifs. Sous Linux, le noyau garde la trace ailleurs : le memory.max d'un cgroup est « le principal mécanisme pour limiter l'usage mémoire », et quand l'usage l'atteint « sans pouvoir être réduit, le tueur OOM est invoqué dans le cgroup ». Le compteur se trouve dans memory.events sous oom_kill, « le nombre de processus appartenant à ce cgroup tués par un tueur OOM quelconque ». Si votre conteneur redémarre sans trace d'exécution, lisez ce fichier avant de relire votre code.",
  "Fixez la limite délibérément, avec docker run --memory (ou -m), dont le minimum est 6M. L'absence de limite n'est pas un défaut sûr, c'est un défaut non examiné : elle signifie que la première charge qui dérape emporte tout l'hôte, et pas seulement elle-même. Un conteneur avec limite échoue de façon prévisible, à un seul endroit, avec un compteur qui le dit.",
  "Déclarez aussi la politique de redémarrage, car elle n'est pas active par défaut. Le Restart= de systemd est documenté ainsi : « s'il vaut no (la valeur par défaut), le service ne sera pas redémarré ». Restart=on-failure redémarre sur un code de sortie non nul ou un signal fatal. Un service qui plante une fois à 3 h du matin et reste à terre jusqu'au matin est presque toujours un service où personne n'a écrit cette ligne.",
  "Avant d'accuser le framework, passez deux minutes à l'extérieur du processus : CPU, mémoire, disque, sockets ouverts. Sature-t-il réellement un cœur, y a-t-il du swap, les connexions s'accumulent-elles en attente. Cela clôt souvent l'enquête, parce que la réponse est visible depuis l'extérieur du code que tout le monde fixe.",
  "Si cette culture paie, c'est qu'elle change la nature du problème. Sans elle, une panne est un événement inexpliqué que l'on subit. Avec elle, ce sont trois ou quatre questions précises, chacune avec un fichier ou une commande qui y répond."
];

const mlTestingPlaybookContent = [
  "Here is a failure you can reproduce in twenty lines, and it is the one that costs students a deployment. Train a LogisticRegression on make_classification(n_samples=4000, n_features=20, n_informative=8, random_state=0) with a StandardScaler fitted on the training split. Score it on the held-out split through that same fitted scaler: 0.901. Now score it the way a naive serving path does, calling StandardScaler().fit_transform() on each incoming request: 0.493.",
  "Read that second number again. It is a coin flip. The model file did not change, the training score did not change, no exception was raised, and every test that only checks \"does the endpoint return 200\" still passes. Fitting a scaler on one row sets that row to zero, so the model receives an all-zeros input for every request — the feature values are gone, and nothing anywhere says so.",
  "The fix is structural, not a rule you remember: make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)) scores 0.901 because the fitted statistics travel inside the object you saved. scikit-learn's own documentation for composite estimators exists for exactly this — one object, one code path, so training and serving cannot drift apart because there is only one of them.",
  "That is why the four layers need separating: the data, the feature transformations, the model behaviour, and the serving endpoint. A failure in each looks identical from outside — bad predictions — and the example above lives entirely in layer two while looking like a model problem.",
  "Validate data before training, and make the check a gate that exits non-zero. A ~20-line function comparing each column against a dtype predicate from pandas.api.types and running a list of named rules — age between 13 and 120, null rate under 5%, category count under 250, no duplicate ids — returns a clean list on a good batch and ['rule failed: age in range', 'rule failed: score mostly present'] on one where a value became 900 and a column went null. Print it, sys.exit(1), and the training job stops instead of producing a confidently wrong model.",
  "Test feature transformations like ordinary code, because that is what they are. A normaliser, a tokeniser, a date parser: each has edge cases, each is a handful of known inputs and expected outputs, and each is where the skew above actually lives.",
  "Evaluate with aggregate metrics and named edge cases together, and freeze the evaluation set. The point of freezing is attribution: if the eval data changes at the same time as the model, a score difference tells you nothing about either. Version it, and change it deliberately rather than incidentally.",
  "Test the serving endpoint as its own layer: response shape, behaviour on malformed input, latency on a realistic payload, and what happens when the model file is missing. Plenty of systems have a correct model behind an endpoint that returns a 500 on any input containing a newline.",
  "Pair offline evaluation with one online signal, because offline agreement is not the same as being right. Even a crude production measurement — how often users retry, how often a result is abandoned — catches drops your evaluation set was never designed to see.",
  "Write down which layer each test covers, what runs on every commit, and what a failure in each means. The 0.901-to-0.493 bug is caught by exactly one test: the one that runs the serving path, not the training path, and compares the score. Nothing else in a normal suite sees it."
];

const mlTestingPlaybookContentFr = [
  "Voici une panne que vous pouvez reproduire en vingt lignes, et c'est celle qui coûte un déploiement aux étudiants. Entraînez une LogisticRegression sur make_classification(n_samples=4000, n_features=20, n_informative=8, random_state=0) avec un StandardScaler ajusté sur l'échantillon d'entraînement. Évaluez-la sur l'échantillon de test à travers ce même scaler ajusté : 0,901. Évaluez-la maintenant comme le fait un chemin de service naïf, en appelant StandardScaler().fit_transform() sur chaque requête entrante : 0,493.",
  "Relisez ce second chiffre. C'est un tirage à pile ou face. Le fichier du modèle n'a pas changé, le score d'entraînement n'a pas changé, aucune exception n'a été levée, et tous les tests qui vérifient seulement « l'endpoint renvoie-t-il 200 » passent encore. Ajuster un scaler sur une seule ligne met cette ligne à zéro : le modèle reçoit donc une entrée entièrement nulle à chaque requête — les valeurs des variables ont disparu, et rien nulle part ne le signale.",
  "Le correctif est structurel, pas une règle à retenir : make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)) obtient 0,901, parce que les statistiques ajustées voyagent à l'intérieur de l'objet que vous avez enregistré. La documentation de scikit-learn sur les estimateurs composites existe exactement pour cela : un seul objet, un seul chemin de code, donc entraînement et service ne peuvent pas diverger puisqu'il n'y en a qu'un.",
  "C'est pourquoi les quatre couches doivent être séparées : les données, les transformations de variables, le comportement du modèle, et l'endpoint de service. Vu de l'extérieur, une panne dans chacune se ressemble — de mauvaises prédictions — et l'exemple ci-dessus vit entièrement dans la couche deux tout en ayant l'air d'un problème de modèle.",
  "Validez les données avant l'entraînement, et faites de ce contrôle une barrière qui sort avec un code non nul. Une fonction d'une vingtaine de lignes comparant chaque colonne à un prédicat de type issu de pandas.api.types et exécutant une liste de règles nommées — âge entre 13 et 120, taux de valeurs nulles sous 5 %, nombre de catégories sous 250, pas d'identifiants en double — renvoie une liste vide sur un bon lot et ['rule failed: age in range', 'rule failed: score mostly present'] sur un lot où une valeur est passée à 900 et une colonne est devenue nulle. Affichez-la, faites sys.exit(1), et l'entraînement s'arrête au lieu de produire un modèle confiant et faux.",
  "Testez les transformations de variables comme du code ordinaire, parce que c'en est. Une normalisation, un tokeniseur, un analyseur de dates : chacun a des cas limites, chacun se résume à quelques entrées connues et sorties attendues, et c'est là que vit réellement l'écart décrit plus haut.",
  "Évaluez avec des métriques agrégées et des cas nommés à la fois, et figez le jeu d'évaluation. L'intérêt du gel est l'attribution : si les données d'évaluation changent en même temps que le modèle, un écart de score ne vous apprend rien sur l'un ni sur l'autre. Versionnez-le, et modifiez-le délibérément plutôt qu'accidentellement.",
  "Testez l'endpoint de service comme une couche à part entière : forme de la réponse, comportement sur entrée malformée, latence sur une charge réaliste, et ce qui se passe quand le fichier de modèle est absent. Beaucoup de systèmes ont un modèle correct derrière un endpoint qui renvoie une 500 dès qu'une entrée contient un retour à la ligne.",
  "Associez évaluation hors ligne et un signal en ligne, car un accord hors ligne n'équivaut pas à avoir raison. Même une mesure de production grossière — fréquence des nouvelles tentatives, fréquence des résultats abandonnés — attrape des baisses que votre jeu d'évaluation n'a jamais été conçu pour voir.",
  "Écrivez quelle couche chaque test couvre, ce qui tourne à chaque commit, et ce que signifie un échec dans chacune. Le bug qui fait passer de 0,901 à 0,493 est attrapé par exactement un test : celui qui exécute le chemin de service, pas le chemin d'entraînement, et qui compare le score. Rien d'autre dans une suite normale ne le voit."
];

const llmGuardrailsContent = [
  "The ceiling on prompt-based defence is documented, and it is lower than most student projects assume. OWASP's LLM01:2025 entry states that \"given the stochastic influence at the heart of the way models work, it is unclear if there are fool-proof methods of prevention for prompt injection\". So an instruction in a system prompt is a request. A check in code is a control. Everything below is the second kind.",
  "There are four places things go wrong, and each needs its own handling: the input you receive, the context you retrieve, the text the model generates, and the actions it is allowed to take. A system that validates only the input has left three doors open.",
  "Write the input check as a function with a test file, not as a paragraph in the prompt. About fifteen lines does it: raise if len(raw) > 4000, apply unicodedata.normalize('NFKC', raw) so fullwidth and lookalike forms collapse to their plain equivalents before any matching, strip control characters with a regex over the ranges \\x00-\\x08, \\x0b, \\x0c, \\x0e-\\x1f and \\x7f, and raise if nothing survives.",
  "Then run it against named cases, which is a twelve-line list and a loop. A normal question passes; a 5,000-character input raises too_long; an input of only \\x00 and \\x1b raises empty after stripping; a question with an ANSI escape sequence in it passes with the escape removed. Four PASS lines and exit 0. This is a test suite, it takes an afternoon to write, and it is the difference between a guardrail and a hope.",
  "Order matters in that function and it is worth knowing why: normalise before you match, or a check looking for a literal string misses the fullwidth version of the same characters, which NFKC would have folded. A length cap is also a cost control — an unbounded input is an unbounded bill on a metered endpoint.",
  "Treat retrieved context as untrusted, because it usually is. If your system ingests web pages or user uploads, that content can carry instructions aimed at the model rather than the reader. Keep retrieved material inside a delimited block — a <sources> element the model is told to answer only from — and never let it reach a code path that can act.",
  "Ground responses in those sources and make the citation part of the contract. A system that returns an answer alongside the passage it came from can be checked by the reader; one that returns a confident paragraph with no provenance cannot be checked at all, which is precisely what people mean when they complain about hallucination.",
  "Constrain actions rather than trusting intentions. If the model can call tools, the authorisation lives in the tool implementation, not in the instruction telling it which tools to use. Ask what the worst possible call would do, then make that call impossible rather than discouraged — the model is not the component you are securing.",
  "Log policy decisions as carefully as errors: what triggered a block, and what the system returned instead. Without that record you cannot distinguish guardrails that work from guardrails that are too strict from guardrails that are quietly failing open, and all three look identical from outside.",
  "Decide what happens when a check fails and make it explicit. Fail closed for anything with consequences; failing open is acceptable only for non-critical enrichment. What is never acceptable is not having decided, which is how a disabled check survives a deploy unnoticed."
];

const llmGuardrailsContentFr = [
  "Le plafond des défenses fondées sur le prompt est documenté, et il est plus bas que ne le supposent la plupart des projets étudiants. L'entrée LLM01:2025 de l'OWASP indique que « compte tenu de l'influence stochastique au cœur du fonctionnement des modèles, il n'est pas certain qu'il existe des méthodes de prévention infaillibles contre l'injection de prompt ». Une instruction dans un prompt système est donc une demande. Une vérification dans le code est un contrôle. Tout ce qui suit relève du second type.",
  "Quatre endroits posent problème, et chacun demande son propre traitement : l'entrée que vous recevez, le contexte que vous récupérez, le texte que le modèle génère, et les actions qu'il a le droit d'entreprendre. Un système qui ne valide que l'entrée a laissé trois portes ouvertes.",
  "Écrivez le contrôle d'entrée comme une fonction accompagnée d'un fichier de tests, pas comme un paragraphe dans le prompt. Une quinzaine de lignes suffisent : levez une exception si len(raw) > 4000, appliquez unicodedata.normalize('NFKC', raw) pour que les formes pleine chasse et les sosies typographiques se réduisent à leur équivalent simple avant toute comparaison, retirez les caractères de contrôle avec une expression régulière sur les plages \\x00-\\x08, \\x0b, \\x0c, \\x0e-\\x1f et \\x7f, et levez une exception s'il ne reste rien.",
  "Exécutez-la ensuite contre des cas nommés, soit une liste de douze lignes et une boucle. Une question normale passe ; une entrée de 5 000 caractères lève too_long ; une entrée composée uniquement de \\x00 et \\x1b lève empty après nettoyage ; une question contenant une séquence d'échappement ANSI passe, l'échappement retiré. Quatre lignes PASS et une sortie 0. C'est une suite de tests, elle s'écrit en un après-midi, et c'est la différence entre un garde-fou et un espoir.",
  "L'ordre compte dans cette fonction, et il vaut la peine de savoir pourquoi : normalisez avant de comparer, sinon un contrôle cherchant une chaîne littérale rate la version pleine chasse des mêmes caractères, que NFKC aurait repliée. Le plafond de longueur est aussi un contrôle de coût : une entrée sans borne est une facture sans borne sur un endpoint facturé à l'usage.",
  "Traitez le contexte récupéré comme non fiable, parce qu'il l'est généralement. Si votre système ingère des pages web ou des fichiers déposés par des utilisateurs, ce contenu peut porter des instructions destinées au modèle plutôt qu'au lecteur. Gardez la matière récupérée dans un bloc délimité — un élément <sources> dont on dit au modèle qu'il est sa seule source de réponse — et ne la laissez jamais atteindre un chemin de code capable d'agir.",
  "Ancrez les réponses dans ces sources et faites de la citation une partie du contrat. Un système qui renvoie une réponse accompagnée du passage dont elle provient peut être vérifié par le lecteur ; un système qui renvoie un paragraphe confiant sans provenance ne peut pas l'être du tout — exactement ce que les gens désignent quand ils parlent d'hallucination.",
  "Contraignez les actions plutôt que de faire confiance aux intentions. Si le modèle peut appeler des outils, l'autorisation vit dans l'implémentation de l'outil, pas dans l'instruction qui lui dit lesquels utiliser. Demandez-vous ce que ferait le pire appel possible, puis rendez cet appel impossible plutôt que déconseillé : le modèle n'est pas le composant que vous sécurisez.",
  "Journalisez les décisions de politique aussi soigneusement que les erreurs : ce qui a déclenché un blocage, et ce que le système a renvoyé à la place. Sans cette trace, impossible de distinguer des garde-fous qui fonctionnent, des garde-fous trop stricts et des garde-fous qui laissent silencieusement passer — vus de l'extérieur, les trois sont identiques.",
  "Décidez de ce qui se passe quand un contrôle échoue, et rendez ce choix explicite. Échouez en bloquant dès qu'il y a des conséquences ; échouer en laissant passer n'est acceptable que pour un enrichissement non critique. Ce qui n'est jamais acceptable, c'est de ne pas avoir décidé — c'est ainsi qu'un contrôle désactivé survit à un déploiement sans que personne ne le remarque."
];

export const csExpansionPosts: BlogPost[] = [
  {
    slug: "data-structures-and-algorithms-for-ai-engineers",
    title: "Data Structures and Algorithms for AI Engineers: What Matters in Production",
    excerpt:
      "A production-first guide to the CS fundamentals that directly improve model serving speed, retrieval quality, and backend reliability.",
    category: "CS Fundamentals",
    intentKeyword: "data structures and algorithms for ai engineers",
    track: "cs",
    tags: ["algorithms", "data-structures", "complexity", "retrieval"],
    cluster: "CS Fundamentals",
    publishedAt: "2026-02-20",
    readTime: "18 min read",
    keywords: [
      "data structures and algorithms for ai engineers",
      "cs fundamentals for ml engineers",
      "time complexity for ai systems"
    ],
    popularScore: 94,
    relatedSlugs: [
      "computer-science-roadmap-for-ai-builders",
      "system-design-for-student-ai-projects",
      "transformers-rag-and-agents-for-students"
    ],
    affiliateCallout: {
      headline: {
        en: "Build faster with a practical CS execution stack",
        fr: "Avancez plus vite avec une stack CS orientée exécution"
      },
      description: {
        en: "Use the resource stack to practice algorithms, deploy benchmarks, and convert CS fundamentals into shipped artifacts.",
        fr: "Utilisez la stack ressources pour pratiquer les algorithmes, déployer des benchmarks et transformer les bases CS en livrables réels."
      },
      links: [
        { label: { en: "Open CS resources", fr: "Ressources CS" }, href: "/resources", note: "Tool stack" },
        { label: { en: "Compare cloud options", fr: "Comparer le cloud" }, href: "/compare", note: "Deployment" }
      ]
    },
    references: [
      {
        source: "MIT OpenCourseWare",
        label: { en: "Introduction to Algorithms (6.006)", fr: "Introduction aux algorithmes (6.006)" },
        href: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/"
      },
      {
        source: "Princeton",
        label: { en: "Algorithms, 4th edition site", fr: "Site Algorithms, 4e édition" },
        href: "https://algs4.cs.princeton.edu/home/"
      },
      {
        source: "Python Docs",
        label: { en: "collections.deque", fr: "collections.deque" },
        href: "https://docs.python.org/3/library/collections.html#collections.deque"
      },
      {
        source: "PostgreSQL",
        label: { en: "Indexes", fr: "Indexes" },
        href: "https://www.postgresql.org/docs/current/indexes.html"
      },
      {
        source: "FAISS",
        label: { en: "FAISS documentation", fr: "Documentation FAISS" },
        href: "https://faiss.ai/"
      }
    ],
    locales: {
      en: {
        title: "Data Structures and Algorithms for AI Engineers: What Matters in Production",
        seoTitle: "Data Structures and Algorithms for AI Engineers",
        excerpt:
          "A production-first guide to the CS fundamentals that directly improve model serving speed, retrieval quality, and backend reliability.",
        content: dsaForAiEngineersContent
      },
      fr: {
        title: "Structures de données et algorithmes pour ingénieurs IA",
        seoTitle: "Structures de données et algorithmes pour l'IA",
        excerpt:
          "Guide pratique des fondamentaux CS qui améliorent directement la vitesse, la fiabilité, et la qualité des systèmes IA.",
        content: dsaForAiEngineersContentFr
      }
    },
    content: []
  },
  {
    slug: "system-design-for-student-ai-projects",
    title: "System Design for Student AI Projects: From Demo to Reliable Product",
    excerpt:
      "A practical architecture playbook to design student projects that survive real users, not just classroom demos.",
    category: "Systems & Backend",
    intentKeyword: "system design for student ai projects",
    track: "cs",
    tags: ["system-design", "backend", "architecture", "reliability"],
    cluster: "Systems and Backend",
    publishedAt: "2026-02-19",
    readTime: "18 min read",
    keywords: [
      "system design for student ai projects",
      "backend architecture for ai apps",
      "software architecture for engineering students"
    ],
    popularScore: 92,
    relatedSlugs: [
      "data-structures-and-algorithms-for-ai-engineers",
      "backend-apis-for-ml-apps",
      "deploy-ml-model-student-budget"
    ],
    affiliateCallout: {
      headline: {
        en: "Ship this architecture with student-friendly infra",
        fr: "Déployez cette architecture avec une infra adaptée étudiant"
      },
      description: {
        en: "Use comparison templates and hosting resources to implement this design with measurable reliability.",
        fr: "Utilisez les comparatifs et ressources cloud pour implémenter ce design avec une fiabilité mesurable."
      },
      links: [
        { label: { en: "Open architecture resources", fr: "Ressources architecture" }, href: "/resources", note: "Execution" },
        { label: { en: "Open comparisons", fr: "Ouvrir comparatifs" }, href: "/compare", note: "High intent" }
      ]
    },
    references: [
      {
        source: "12-Factor",
        label: { en: "The Twelve-Factor App", fr: "The Twelve-Factor App" },
        href: "https://12factor.net/"
      },
      {
        source: "Google SRE",
        label: { en: "Site Reliability Engineering book", fr: "Livre Site Reliability Engineering" },
        href: "https://sre.google/sre-book/table-of-contents/"
      },
      {
        source: "AWS",
        label: { en: "Well-Architected Framework", fr: "Well-Architected Framework" },
        href: "https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html"
      },
      {
        source: "IETF",
        label: { en: "HTTP Semantics (RFC 9110)", fr: "HTTP Semantics (RFC 9110)" },
        href: "https://www.rfc-editor.org/rfc/rfc9110"
      },
      {
        source: "Cloudflare",
        label: { en: "What is API architecture?", fr: "Qu'est-ce qu'une architecture API ?" },
        href: "https://www.cloudflare.com/learning/api/what-is-an-api/"
      }
    ],
    locales: {
      en: {
        title: "System Design for Student AI Projects: From Demo to Reliable Product",
        seoTitle: "System Design for Student AI Projects",
        excerpt:
          "A practical architecture playbook to design student projects that survive real users, not just classroom demos.",
        content: systemDesignForStudentsContent
      },
      fr: {
        title: "System design pour projets IA étudiants",
        excerpt:
          "Un playbook d'architecture pour passer de la démo au produit fiable et explicable en entretien.",
        content: systemDesignForStudentsContentFr
      }
    },
    content: []
  },
  {
    slug: "backend-apis-for-ml-apps",
    title: "Backend APIs for ML Apps: Contracts, Reliability, and Security",
    excerpt:
      "How to build production-grade APIs for ML features with clear schemas, robust error handling, and deployable quality gates.",
    category: "Systems & Backend",
    intentKeyword: "backend apis for ml apps",
    track: "cs",
    tags: ["backend", "fastapi", "api-design", "ml-engineering"],
    cluster: "Systems and Backend",
    publishedAt: "2026-02-18",
    readTime: "17 min read",
    keywords: [
      "backend apis for ml apps",
      "fastapi for machine learning",
      "api design for ai products"
    ],
    popularScore: 91,
    relatedSlugs: [
      "system-design-for-student-ai-projects",
      "ml-engineering-testing-playbook",
      "deploy-ml-model-student-budget"
    ],
    affiliateCallout: {
      headline: {
        en: "Need low-friction backend deployment?",
        fr: "Besoin d'un déploiement backend sans friction ?"
      },
      description: {
        en: "Use the resource stack to deploy your API, monitor latency, and keep costs predictable during student projects.",
        fr: "Utilisez la stack ressources pour déployer votre API, suivre la latence, et garder des coûts prévisibles."
      },
      links: [
        { label: { en: "Open backend resources", fr: "Ressources backend" }, href: "/resources", note: "Tools" },
        { label: { en: "Compare platforms", fr: "Comparer plateformes" }, href: "/compare", note: "Cloud options" }
      ]
    },
    references: [
      {
        source: "FastAPI",
        label: { en: "FastAPI documentation", fr: "Documentation FastAPI" },
        href: "https://fastapi.tiangolo.com/"
      },
      {
        source: "OpenAPI",
        label: { en: "OpenAPI Specification", fr: "Spécification OpenAPI" },
        href: "https://spec.openapis.org/oas/latest.html"
      },
      {
        source: "MDN",
        label: { en: "HTTP response status codes", fr: "Codes de statut HTTP" },
        href: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status"
      },
      {
        source: "OWASP",
        label: { en: "OWASP API Security Top 10", fr: "OWASP API Security Top 10" },
        href: "https://owasp.org/API-Security/"
      },
      {
        source: "PostgreSQL",
        label: { en: "PostgreSQL docs", fr: "Documentation PostgreSQL" },
        href: "https://www.postgresql.org/docs/current/"
      }
    ],
    locales: {
      en: {
        title: "Backend APIs for ML Apps: Contracts, Reliability, and Security",
        seoTitle: "Backend APIs for ML Apps: Reliability, Security",
        excerpt:
          "How to build production-grade APIs for ML features with clear schemas, robust error handling, and deployable quality gates.",
        content: backendApisForMlAppsContent
      },
      fr: {
        title: "APIs backend pour apps ML",
        excerpt:
          "Comment construire des APIs ML fiables avec schémas clairs, sécurité, et qualité déploiement.",
        content: backendApisForMlAppsContentFr
      }
    },
    content: []
  },
  {
    slug: "linux-devops-workflow-for-students",
    title: "Linux and DevOps Workflow for Students: Ship Faster, Break Less",
    excerpt:
      "A practical Linux + DevOps operating system for engineering students who want reliable releases and cleaner project delivery.",
    category: "Cloud/DevOps",
    intentKeyword: "linux devops workflow for students",
    track: "cs",
    tags: ["linux", "devops", "deployment", "ci-cd"],
    cluster: "Cloud and DevOps",
    publishedAt: "2026-02-17",
    readTime: "17 min read",
    keywords: [
      "linux devops workflow for students",
      "devops for ai projects",
      "ci cd for student developers"
    ],
    popularScore: 90,
    relatedSlugs: [
      "cicd-for-ml-and-backend-projects",
      "observability-for-student-engineers",
      "deploy-ml-model-student-budget"
    ],
    affiliateCallout: {
      headline: {
        en: "Use a cloud stack that fits this workflow",
        fr: "Utilisez une stack cloud adaptée à ce workflow"
      },
      description: {
        en: "Deploy faster with student-friendly cloud options and compare platform tradeoffs before locking your stack.",
        fr: "Déployez plus vite avec des options cloud étudiantes et comparez les compromis avant de verrouiller votre stack."
      },
      links: [
        { label: { en: "Open DevOps resources", fr: "Ressources DevOps" }, href: "/resources", note: "Tooling" },
        { label: { en: "Open cloud comparison", fr: "Comparatif cloud" }, href: "/compare", note: "Decision" }
      ]
    },
    references: [
      {
        source: "Linux man pages",
        label: { en: "Linux man-pages project", fr: "Projet Linux man-pages" },
        href: "https://www.kernel.org/doc/man-pages/"
      },
      {
        source: "Docker",
        label: { en: "Docker documentation", fr: "Documentation Docker" },
        href: "https://docs.docker.com/"
      },
      {
        source: "Git",
        label: { en: "Git documentation", fr: "Documentation Git" },
        href: "https://git-scm.com/doc"
      },
      {
        source: "GitHub",
        label: { en: "GitHub Actions documentation", fr: "Documentation GitHub Actions" },
        href: "https://docs.github.com/en/actions"
      },
      {
        source: "systemd",
        label: { en: "systemd documentation", fr: "Documentation systemd" },
        href: "https://systemd.io/"
      }
    ],
    locales: {
      en: {
        title: "Linux and DevOps Workflow for Students: Ship Faster, Break Less",
        seoTitle: "Linux and DevOps Workflow for Students",
        excerpt:
          "A practical Linux + DevOps operating system for engineering students who want reliable releases and cleaner project delivery.",
        content: linuxDevopsWorkflowContent
      },
      fr: {
        title: "Workflow Linux et DevOps pour étudiants",
        excerpt:
          "Un système Linux + DevOps pratique pour livrer plus vite avec moins de régressions.",
        content: linuxDevopsWorkflowContentFr
      }
    },
    content: []
  },
  {
    slug: "security-checklist-for-student-ai-and-cs-projects",
    title: "Security Checklist for Student AI and CS Projects",
    excerpt: "A practical security baseline to protect student projects before public launch.",
    category: "Security & Performance",
    intentKeyword: "security checklist for student ai projects",
    track: "cs",
    tags: ["security", "api-security", "auth", "reliability"],
    cluster: "Security and Reliability",
    publishedAt: "2026-02-16",
    readTime: "9 min read",
    keywords: [
      "security checklist for student ai projects",
      "api security for students",
      "secure machine learning app"
    ],
    popularScore: 86,
    relatedSlugs: ["backend-apis-for-ml-apps", "llm-guardrails-and-evaluation-basics"],
    affiliateCallout: {
      headline: { en: "Apply this checklist with deployment-ready tooling", fr: "Appliquez cette checklist avec des outils deployment-ready" },
      description: {
        en: "Use the resources stack for hosting, logging, and deployment controls with student-friendly setup.",
        fr: "Utilisez la stack ressources pour hébergement, logs, et contrôles déploiement avec setup étudiant."
      },
      links: [
        { label: { en: "Open security resources", fr: "Ressources sécurité" }, href: "/resources", note: "Tools" },
        { label: { en: "Compare secure hosts", fr: "Comparer hébergeurs" }, href: "/compare", note: "Security tradeoffs" }
      ]
    },
    references: [
      {
        source: "OWASP",
        label: { en: "OWASP API1:2023 Broken Object Level Authorization", fr: "OWASP API1:2023 Broken Object Level Authorization" },
        href: "https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/"
      },
      {
        source: "OWASP",
        label: { en: "OWASP ASVS", fr: "OWASP ASVS" },
        href: "https://owasp.org/ASVS/"
      },
      {
        source: "nginx",
        label: { en: "nginx client_max_body_size", fr: "nginx client_max_body_size" },
        href: "https://nginx.org/en/docs/http/ngx_http_core_module.html"
      },
      {
        source: "Express",
        label: { en: "body-parser limit option", fr: "Option limit de body-parser" },
        href: "https://expressjs.com/en/resources/middleware/body-parser.html"
      },
      {
        source: "npm",
        label: { en: "npm audit and --audit-level", fr: "npm audit et --audit-level" },
        href: "https://docs.npmjs.com/cli/v11/commands/npm-audit"
      }
    ],
    locales: {
      en: {
        title: "Security Checklist for Student AI and CS Projects",
        excerpt: "A practical security baseline to protect student projects before public launch.",
        content: securityChecklistContent
      },
      fr: {
        title: "Checklist sécurité pour projets IA et informatique",
        excerpt: "Une base sécurité pratique pour protéger les projets étudiants avant publication.",
        content: securityChecklistContentFr
      }
    },
    content: []
  },
  {
    slug: "database-design-for-rag-and-ml-apps",
    title: "Database Design for RAG and ML Apps",
    excerpt: "How to model data for retrieval, reliability, and performance in student AI systems.",
    category: "Systems & Backend",
    intentKeyword: "database design for rag and ml apps",
    track: "cs",
    tags: ["database", "rag", "postgres", "schema-design"],
    cluster: "Systems and Backend",
    publishedAt: "2026-02-15",
    readTime: "8 min read",
    keywords: [
      "database design for rag and ml apps",
      "postgres schema for ai apps",
      "vector database architecture for students"
    ],
    popularScore: 84,
    relatedSlugs: ["backend-apis-for-ml-apps", "system-design-for-student-ai-projects"],
    affiliateCallout: {
      headline: { en: "Deploy your data layer with student-friendly infra", fr: "Déployez votre couche data avec une infra adaptée" },
      description: {
        en: "Use cloud resources and comparison templates to choose a database stack that matches your workload.",
        fr: "Utilisez ressources cloud et comparatifs pour choisir une stack base de données adaptée à votre charge."
      },
      links: [
        { label: { en: "Open data resources", fr: "Ressources data" }, href: "/resources", note: "Execution" },
        { label: { en: "Compare platforms", fr: "Comparer plateformes" }, href: "/compare", note: "Decision" }
      ]
    },
    references: [
      {
        source: "PostgreSQL",
        label: { en: "PostgreSQL EXPLAIN", fr: "EXPLAIN PostgreSQL" },
        href: "https://www.postgresql.org/docs/current/sql-explain.html"
      },
      {
        source: "pgvector",
        label: { en: "pgvector: vector types, operators and HNSW indexes", fr: "pgvector : types vectoriels, opérateurs et index HNSW" },
        href: "https://github.com/pgvector/pgvector"
      },
      {
        source: "SQLite",
        label: { en: "SQLite UPSERT (ON CONFLICT)", fr: "UPSERT SQLite (ON CONFLICT)" },
        href: "https://www.sqlite.org/lang_UPSERT.html"
      }
    ],
    locales: {
      en: {
        title: "Database Design for RAG and ML Apps",
        excerpt: "How to model data for retrieval, reliability, and performance in student AI systems.",
        content: databaseDesignContent
      },
      fr: {
        title: "Design de base de données pour apps RAG et ML",
        excerpt: "Comment modéliser les données pour retrieval, fiabilité, et performance.",
        content: databaseDesignContentFr
      }
    },
    content: []
  },
  {
    slug: "cicd-for-ml-and-backend-projects",
    title: "CI/CD for ML and Backend Projects",
    excerpt: "A lightweight release pipeline that keeps student projects stable and deployable.",
    category: "Cloud/DevOps",
    intentKeyword: "ci cd for ml and backend projects",
    track: "cs",
    tags: ["ci-cd", "github-actions", "release-engineering", "devops"],
    cluster: "Cloud and DevOps",
    publishedAt: "2026-02-14",
    readTime: "8 min read",
    keywords: [
      "ci cd for ml and backend projects",
      "github actions for student developers",
      "release pipeline for ai apps"
    ],
    popularScore: 83,
    relatedSlugs: ["linux-devops-workflow-for-students", "deploy-ml-model-student-budget"],
    affiliateCallout: {
      headline: { en: "Use this CI/CD flow with practical cloud options", fr: "Utilisez ce flow CI/CD avec des options cloud pratiques" },
      description: {
        en: "Pair this pipeline with hosting comparisons to keep deployments predictable and low-cost.",
        fr: "Associez ce pipeline aux comparatifs cloud pour des déploiements prévisibles et low-cost."
      },
      links: [
        { label: { en: "Open deployment resources", fr: "Ressources déploiement" }, href: "/resources", note: "Tools" },
        { label: { en: "Cloud comparisons", fr: "Comparatifs cloud" }, href: "/compare", note: "Budget" }
      ]
    },
    references: [
      {
        source: "GitHub",
        label: { en: "GitHub Actions workflow syntax", fr: "Syntaxe des workflows GitHub Actions" },
        href: "https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax"
      },
      {
        source: "GitHub",
        label: { en: "GitHub Actions billing and included minutes", fr: "Facturation GitHub Actions et minutes incluses" },
        href: "https://docs.github.com/en/billing/concepts/product-billing/github-actions"
      },
      {
        source: "Docker",
        label: { en: "Docker Build", fr: "Docker Build" },
        href: "https://docs.docker.com/build/"
      },
      {
        source: "Google",
        label: { en: "MLOps: continuous delivery and automation pipelines", fr: "MLOps : livraison continue et pipelines d'automatisation" },
        href: "https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning"
      }
    ],
    locales: {
      en: {
        title: "CI/CD for ML and Backend Projects",
        excerpt: "A lightweight release pipeline that keeps student projects stable and deployable.",
        content: cicdContent
      },
      fr: {
        title: "CI/CD pour projets ML et backend",
        excerpt: "Un pipeline release simple pour garder les projets étudiants stables et déployables.",
        content: cicdContentFr
      }
    },
    content: []
  },
  {
    slug: "observability-for-student-engineers",
    title: "Observability for Student Engineers: Logs, Metrics, Traces",
    excerpt: "A practical observability baseline to debug faster and ship more reliable AI + Cybersecurity services.",
    category: "Security & Performance",
    intentKeyword: "observability for student engineers",
    track: "cs",
    tags: ["observability", "metrics", "logs", "tracing"],
    cluster: "Security and Reliability",
    publishedAt: "2026-02-13",
    readTime: "8 min read",
    keywords: [
      "observability for student engineers",
      "logs metrics traces for ai apps",
      "monitoring student backend projects"
    ],
    popularScore: 82,
    relatedSlugs: ["linux-devops-workflow-for-students", "system-design-for-student-ai-projects"],
    affiliateCallout: {
      headline: { en: "Need a stack to ship and observe faster?", fr: "Besoin d'une stack pour shipper et observer plus vite ?" },
      description: {
        en: "Use the recommended resources to deploy monitoring-ready services and compare hosting tradeoffs.",
        fr: "Utilisez les ressources recommandées pour déployer des services observables et comparer les compromis cloud."
      },
      links: [
        { label: { en: "Open observability resources", fr: "Ressources observabilité" }, href: "/resources", note: "Tools" },
        { label: { en: "Compare infra", fr: "Comparer infra" }, href: "/compare", note: "Cloud" }
      ]
    },
    // Verified against each page's visible text. P0 names the statistics module and cites it for the method (quantiles n=100); the numbers are the author's dataset, reproduced independently. P1 quotes the histogram_quantile example verbatim from the Prometheus function docs. P3 matches the traceparent ABNF in the W3C spec. Ref 4 (OpenTelemetry docs root) supports no claim and is cited by nothing.
    paragraphCitations: { 0: [3], 1: [1], 3: [2] },
    references: [
      {
        source: "Prometheus",
        label: { en: "Prometheus histogram_quantile", fr: "histogram_quantile de Prometheus" },
        href: "https://prometheus.io/docs/prometheus/latest/querying/functions/"
      },
      {
        source: "W3C",
        label: { en: "W3C Trace Context (traceparent)", fr: "W3C Trace Context (traceparent)" },
        href: "https://www.w3.org/TR/trace-context/"
      },
      {
        source: "Python",
        label: { en: "Python statistics module", fr: "Module statistics de Python" },
        href: "https://docs.python.org/3/library/statistics.html"
      },
      {
        source: "OpenTelemetry",
        label: { en: "OpenTelemetry documentation", fr: "Documentation OpenTelemetry" },
        href: "https://opentelemetry.io/docs/"
      }
    ],
    locales: {
      en: {
        title: "Observability for Student Engineers: Logs, Metrics, Traces",
        seoTitle: "Observability for Students: Logs, Metrics, Traces",
        excerpt: "A practical observability baseline to debug faster and ship more reliable AI + Cybersecurity services.",
        content: observabilityContent
      },
      fr: {
        title: "Observabilité pour étudiants ingénieurs",
        excerpt: "Une base observabilité pratique pour debugger plus vite et livrer des services fiables.",
        content: observabilityContentFr
      }
    },
    content: []
  },
  {
    slug: "networking-basics-for-ai-backend-engineers",
    title: "Networking Basics for AI and Backend Engineers",
    excerpt: "The networking concepts that directly impact API latency, retries, and reliability.",
    category: "CS Fundamentals",
    intentKeyword: "networking basics for ai backend engineers",
    track: "cs",
    tags: ["networking", "http", "latency", "distributed-systems"],
    cluster: "CS Fundamentals",
    publishedAt: "2026-02-12",
    readTime: "7 min read",
    keywords: [
      "networking basics for ai backend engineers",
      "http latency for api design",
      "distributed systems basics for students"
    ],
    popularScore: 81,
    relatedSlugs: ["backend-apis-for-ml-apps", "system-design-for-student-ai-projects"],
    affiliateCallout: {
      headline: { en: "Turn networking concepts into deployable projects", fr: "Transformez les concepts réseau en projets déployables" },
      description: {
        en: "Use cloud resources and comparison guides to test latency and reliability patterns in real deployments.",
        fr: "Utilisez ressources cloud et comparatifs pour tester latence et fiabilité sur de vrais déploiements."
      },
      links: [
        { label: { en: "Open resources", fr: "Ouvrir ressources" }, href: "/resources", note: "Execution" },
        { label: { en: "Open comparisons", fr: "Ouvrir comparatifs" }, href: "/compare", note: "Infrastructure" }
      ]
    },
    // P0 and P7: every --write-out variable named is documented on the curl manpage. P3: the TCP round-trip clause only, from MDN plus RFC 9293's three-way handshake. P4: three verbatim quotes from the requests quickstart. P2's Session connection-reuse claim stays uncited -- the quickstart page never mentions sessions.
    paragraphCitations: { 0: [1], 3: [3, 4], 4: [2], 7: [1] },
    references: [
      {
        source: "curl",
        label: { en: "curl manual: --write-out variables", fr: "Manuel curl : variables --write-out" },
        href: "https://curl.se/docs/manpage.html"
      },
      {
        source: "Requests",
        label: { en: "Requests: timeouts", fr: "Requests : délais d'attente" },
        href: "https://requests.readthedocs.io/en/latest/user/quickstart/"
      },
      {
        source: "MDN",
        label: { en: "An overview of HTTP", fr: "Vue d'ensemble de HTTP" },
        href: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview"
      },
      {
        source: "RFC Editor",
        label: { en: "RFC 9293 (TCP)", fr: "RFC 9293 (TCP)" },
        href: "https://www.rfc-editor.org/rfc/rfc9293"
      }
    ],
    locales: {
      en: {
        title: "Networking Basics for AI and Backend Engineers",
        excerpt: "The networking concepts that directly impact API latency, retries, and reliability.",
        content: networkingBasicsContent
      },
      fr: {
        title: "Bases réseau pour ingénieurs IA et backend",
        excerpt: "Les concepts réseau qui impactent directement latence API et fiabilité.",
        content: networkingBasicsContentFr
      }
    },
    content: []
  },
  {
    slug: "operating-systems-skills-for-ai-builders",
    title: "Operating Systems Skills Every AI Builder Uses in Production",
    excerpt: "Practical OS knowledge for debugging, performance tuning, and safer deployments.",
    category: "CS Fundamentals",
    intentKeyword: "operating systems skills for ai builders",
    track: "cs",
    tags: ["operating-systems", "linux", "performance", "debugging"],
    cluster: "CS Fundamentals",
    publishedAt: "2026-02-11",
    readTime: "7 min read",
    keywords: [
      "operating systems skills for ai builders",
      "linux debugging for student engineers",
      "os concepts for backend reliability"
    ],
    popularScore: 80,
    relatedSlugs: ["linux-devops-workflow-for-students", "data-structures-and-algorithms-for-ai-engineers"],
    affiliateCallout: {
      headline: { en: "Pair OS skills with deployment practice", fr: "Combinez skills système et pratique déploiement" },
      description: {
        en: "Use curated resources and cloud comparisons to apply OS concepts in real backend and AI services.",
        fr: "Utilisez ressources et comparatifs cloud pour appliquer les concepts système sur des services réels."
      },
      links: [
        { label: { en: "Open resources", fr: "Ressources" }, href: "/resources", note: "Tool stack" },
        { label: { en: "Compare hosts", fr: "Comparer hébergeurs" }, href: "/compare", note: "Deployment" }
      ]
    },
    // P1: docker stop's SIGTERM default and 10s grace, plus systemd TimeoutStopSec. P2: Python signal docs, which state SIGINT becomes KeyboardInterrupt while SIGTERM gets no installed handler. P4: cgroup v2 memory.max, memory.events and oom_kill, all verbatim. P6: systemd Restart= values. P5 stays uncited -- --memory is on docker run, not the docker stop page cited here.
    paragraphCitations: { 1: [1, 3], 2: [4], 4: [2], 6: [3] },
    references: [
      {
        source: "Docker",
        label: { en: "docker stop: signal and grace period", fr: "docker stop : signal et délai de grâce" },
        href: "https://docs.docker.com/reference/cli/docker/container/stop/"
      },
      {
        source: "Linux Kernel",
        label: { en: "Control Group v2: memory.max and memory.events", fr: "Control Group v2 : memory.max et memory.events" },
        href: "https://docs.kernel.org/admin-guide/cgroup-v2.html"
      },
      {
        source: "systemd",
        label: { en: "systemd.service: Restart= and TimeoutStopSec=", fr: "systemd.service : Restart= et TimeoutStopSec=" },
        href: "https://man7.org/linux/man-pages/man5/systemd.service.5.html"
      },
      {
        source: "Python",
        label: { en: "Python signal module", fr: "Module signal de Python" },
        href: "https://docs.python.org/3/library/signal.html"
      },
      {
        source: "OSTEP",
        label: { en: "Operating Systems: Three Easy Pieces", fr: "Operating Systems: Three Easy Pieces" },
        href: "https://pages.cs.wisc.edu/~remzi/OSTEP/"
      }
    ],
    locales: {
      en: {
        title: "Operating Systems Skills Every AI Builder Uses in Production",
        seoTitle: "Operating Systems Skills Every AI Builder Uses",
        excerpt: "Practical OS knowledge for debugging, performance tuning, and safer deployments.",
        content: operatingSystemsSkillsContent
      },
      fr: {
        title: "Compétences système essentielles pour builders IA",
        excerpt: "Connaissances OS pratiques pour debug, performance, et déploiements plus fiables.",
        content: operatingSystemsSkillsContentFr
      }
    },
    content: []
  },
  {
    slug: "ml-engineering-testing-playbook",
    title: "ML Engineering Testing Playbook for Student Teams",
    excerpt: "How to design test layers that keep ML quality stable from notebook to production.",
    category: "ML Engineering",
    intentKeyword: "ml engineering testing playbook",
    track: "cs",
    tags: ["ml-engineering", "testing", "evaluation", "quality"],
    cluster: "ML Engineering",
    publishedAt: "2026-02-10",
    readTime: "8 min read",
    keywords: [
      "ml engineering testing playbook",
      "machine learning quality assurance",
      "model regression testing for students"
    ],
    popularScore: 85,
    relatedSlugs: ["backend-apis-for-ml-apps", "llm-guardrails-and-evaluation-basics"],
    affiliateCallout: {
      headline: { en: "Build a test-first ML workflow", fr: "Construisez un workflow ML test-first" },
      description: {
        en: "Use resources and product templates to build repeatable testing loops across data, model, and deployment.",
        fr: "Utilisez ressources et templates pour des boucles de test répétables sur data, modèle, et déploiement."
      },
      links: [
        { label: { en: "Open ML resources", fr: "Ressources ML" }, href: "/resources", note: "Tools" },
        { label: { en: "Student guide", fr: "Guide étudiant" }, href: "/product/ai-career-guide", note: "Workflow" }
      ]
    },
    // P2: sklearn's own leakage rationale for make_pipeline, plus Rules of ML #32 on reusing code between training and serving. P4 and P7: Rules of ML #5, on gating data into the algorithm and testing infrastructure independently of the learning. Ref 2 is a section index with no prose and is cited by nothing.
    paragraphCitations: { 2: [1, 3], 4: [3], 7: [3] },
    references: [
      {
        source: "scikit-learn",
        label: { en: "Pipelines and composite estimators", fr: "Pipelines et estimateurs composites" },
        href: "https://scikit-learn.org/stable/modules/compose.html"
      },
      {
        source: "scikit-learn",
        label: { en: "Model selection and evaluation", fr: "Sélection et évaluation de modèles" },
        href: "https://scikit-learn.org/stable/model_selection.html"
      },
      {
        source: "Google",
        label: { en: "Rules of Machine Learning", fr: "Rules of Machine Learning" },
        href: "https://developers.google.com/machine-learning/guides/rules-of-ml"
      }
    ],
    locales: {
      en: {
        title: "ML Engineering Testing Playbook for Student Teams",
        excerpt: "How to design test layers that keep ML quality stable from notebook to production.",
        content: mlTestingPlaybookContent
      },
      fr: {
        title: "Playbook de tests ML engineering",
        excerpt: "Comment concevoir des couches de tests qui stabilisent la qualité ML jusqu'en production.",
        content: mlTestingPlaybookContentFr
      }
    },
    content: []
  },
  {
    slug: "llm-guardrails-and-evaluation-basics",
    title: "LLM Guardrails and Evaluation Basics for Student Products",
    excerpt: "A practical framework to reduce unsafe behavior and quality drift in LLM applications.",
    category: "LLM Systems",
    intentKeyword: "llm guardrails and evaluation basics",
    track: "cs",
    tags: ["llm", "guardrails", "evaluation", "ai-safety"],
    cluster: "LLM Systems",
    publishedAt: "2026-02-09",
    readTime: "8 min read",
    keywords: [
      "llm guardrails and evaluation basics",
      "llm safety for student projects",
      "llm evaluation framework"
    ],
    popularScore: 84,
    relatedSlugs: ["transformers-rag-and-agents-for-students", "security-checklist-for-student-ai-and-cs-projects"],
    affiliateCallout: {
      headline: { en: "Deploy safer LLM systems with practical tooling", fr: "Déployez des systèmes LLM plus fiables avec des outils pratiques" },
      description: {
        en: "Use resource and comparison pages to pick infra and workflow tools for guardrailed LLM deployments.",
        fr: "Utilisez ressources et comparatifs pour choisir infra et workflow déploiement LLM avec guardrails."
      },
      links: [
        { label: { en: "Open LLM resources", fr: "Ressources LLM" }, href: "/resources", note: "Tools" },
        { label: { en: "Compare deployment options", fr: "Comparer options déploiement" }, href: "/compare", note: "Cloud" }
      ]
    },
    // All four from OWASP LLM01:2025, quoted verbatim: no fool-proof prevention (P0), segregate untrusted content (P5), request source citations and assess groundedness (P6), least privilege and human-in-the-loop (P7). The Unicode normalisation paragraph stays uncited: the page covers base64 and emoji evasion, which is a different claim.
    paragraphCitations: { 0: [1], 5: [1], 6: [1], 7: [1] },
    references: [
      {
        source: "OWASP",
        label: { en: "OWASP LLM01:2025 Prompt Injection", fr: "OWASP LLM01:2025 Injection de prompt" },
        href: "https://genai.owasp.org/llmrisk/llm01-prompt-injection/"
      },
      {
        source: "OWASP",
        label: { en: "OWASP Top 10 for LLM Applications", fr: "OWASP Top 10 pour applications LLM" },
        href: "https://owasp.org/www-project-top-10-for-large-language-model-applications/"
      },
      {
        source: "NIST",
        label: { en: "NIST AI Risk Management Framework", fr: "NIST AI Risk Management Framework" },
        href: "https://www.nist.gov/itl/ai-risk-management-framework"
      },
      {
        source: "Anthropic",
        label: { en: "Building effective agents", fr: "Building effective agents" },
        href: "https://www.anthropic.com/engineering/building-effective-agents"
      }
    ],
    locales: {
      en: {
        title: "LLM Guardrails and Evaluation Basics for Student Products",
        seoTitle: "LLM Guardrails and Evaluation Basics",
        excerpt: "A practical framework to reduce unsafe behavior and quality drift in LLM applications.",
        content: llmGuardrailsContent
      },
      fr: {
        title: "Bases guardrails et évaluation LLM",
        excerpt: "Un cadre pratique pour réduire comportements risqués et dérive de qualité en applications LLM.",
        content: llmGuardrailsContentFr
      }
    },
    content: []
  }
];
