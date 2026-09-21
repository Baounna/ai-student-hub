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
  "Security is one of the fastest ways to separate your project from a tutorial clone, because almost no student project has any. The controls that matter most are not sophisticated — input validation, permission checks, secret hygiene — and their absence is what makes the difference between a portfolio piece and a liability you put on the public internet.",
  "Start with secrets, because this is the mistake that cannot be undone. Keys belong in environment variables or a managed secret store, never in the repository. If one is committed, rotating it is mandatory and deleting the commit is not sufficient — the history is distributed the moment anyone clones, and public repositories are scanned continuously by people looking for exactly this.",
  "Check authorisation on every route that touches data, not just authentication. Knowing who someone is does not tell you what they may see. The common failure is an endpoint that accepts an identifier and returns the record without confirming the requester owns it — which means anyone who can change a number in a URL can read someone else's data.",
  "Validate input at the boundary, with explicit limits. Maximum payload size, expected types, allowed values. This is a reliability control as much as a security one: a request body with no size limit is a denial of service waiting to be discovered, and on an AI endpoint it is also an unbounded cost.",
  "Treat any user text that reaches a prompt template as hostile. Cap its length, keep it clearly separated from your instructions, and never let it influence which tool runs or with what privileges. The authorisation decision belongs in your code, not in a sentence asking the model to be careful.",
  "Rate limit everything public, per identity where you can and per address where you cannot. On an inference endpoint this is primarily a cost control, and the absence of it is how a free project becomes an unexpected invoice in an afternoon.",
  "Be careful what your logs and error messages contain. A stack trace returned to the client tells an attacker about your internals; a log line containing a token moves that token somewhere with weaker access control than wherever it started. Decide once, centrally, what is safe to record and to return.",
  "Keep dependencies updated and let an automated audit run on every build. Most real-world compromises of small projects arrive through a known vulnerability in something you installed and forgot, not through a novel attack on code you wrote.",
  "Add one regression test per critical endpoint — one that asserts an unauthorised request is refused. A test is what keeps a control in place after the refactor that would otherwise remove it, and it is cheap to write while the behaviour is fresh.",
  "None of this has to arrive at once. Security maturity is incremental, and a student team applying a consistent basic checklist before each release is already ahead of most projects on the public internet."
];

const securityChecklistContentFr = [
  "La sécurité est l'un des moyens les plus rapides de distinguer votre projet d'un clone de tutoriel, parce que presque aucun projet étudiant n'en a. Les contrôles qui comptent le plus ne sont pas sophistiqués — validation des entrées, contrôles de permission, hygiène des secrets — et leur absence fait la différence entre une pièce de portfolio et un risque déposé sur l'internet public.",
  "Commencez par les secrets, car c'est l'erreur irréversible. Les clés appartiennent aux variables d'environnement ou à un gestionnaire de secrets, jamais au dépôt. Si l'une est commitée, la faire tourner est obligatoire et supprimer le commit ne suffit pas : l'historique est distribué dès qu'une personne clone, et les dépôts publics sont scannés en continu par des gens qui cherchent exactement cela.",
  "Vérifiez l'autorisation sur chaque route qui touche des données, pas seulement l'authentification. Savoir qui est quelqu'un ne dit pas ce qu'il a le droit de voir. L'erreur classique est un endpoint qui accepte un identifiant et renvoie l'enregistrement sans confirmer que le demandeur en est propriétaire — ce qui signifie que quiconque sait changer un chiffre dans une URL peut lire les données d'autrui.",
  "Validez les entrées à la frontière, avec des limites explicites. Taille maximale de charge utile, types attendus, valeurs autorisées. C'est autant un contrôle de fiabilité que de sécurité : un corps de requête sans limite de taille est un déni de service en attente d'être découvert, et sur un endpoint d'IA c'est aussi un coût sans borne.",
  "Considérez comme hostile tout texte utilisateur qui atteint un template de prompt. Plafonnez sa longueur, gardez-le nettement séparé de vos instructions, et ne le laissez jamais influencer quel outil s'exécute ni avec quels privilèges. La décision d'autorisation appartient à votre code, pas à une phrase demandant au modèle d'être prudent.",
  "Limitez le débit de tout ce qui est public, par identité quand c'est possible et par adresse sinon. Sur un endpoint d'inférence, c'est d'abord un contrôle de coût, et son absence est la façon dont un projet gratuit devient une facture inattendue en un après-midi.",
  "Faites attention à ce que contiennent vos journaux et vos messages d'erreur. Une trace d'exécution renvoyée au client renseigne un attaquant sur vos entrailles ; une ligne de journal contenant un jeton déplace ce jeton vers un endroit moins bien protégé que son origine. Décidez une fois, de façon centralisée, ce qu'il est sûr d'enregistrer et de renvoyer.",
  "Maintenez les dépendances à jour et laissez un audit automatique tourner à chaque build. La plupart des compromissions réelles de petits projets passent par une vulnérabilité connue dans quelque chose que vous avez installé puis oublié, pas par une attaque inédite sur votre code.",
  "Ajoutez un test de régression par endpoint critique — un test qui vérifie qu'une requête non autorisée est refusée. C'est le test qui maintient un contrôle en place après le remaniement qui l'aurait supprimé, et il est peu coûteux à écrire tant que le comportement est frais.",
  "Rien de tout cela n'a besoin d'arriver d'un coup. La maturité en sécurité est incrémentale, et une équipe étudiante qui applique une liste de base cohérente avant chaque livraison est déjà devant la plupart des projets publics."
];

const databaseDesignContent = [
  "An AI product has three workloads that want different things from a database: transactional data that needs consistency, vector data that needs similarity search, and telemetry that is written constantly and read rarely. Pushing all three through one generic store is the decision students regret, because the tuning that helps one actively hurts another.",
  "Model the core entities before thinking about embeddings at all. Users, projects, documents, jobs, evaluations — each with a primary key, an explicit ownership field, and created and updated timestamps. Ownership in particular saves you later: a row that cannot say who it belongs to makes every permission check a join you did not plan for.",
  "Index for the queries you actually run, and verify with a query plan rather than intuition. Indexes are not free — each one costs write throughput and storage, and a table with an index on every column is usually a sign that nobody measured. Look at what your slow queries are doing before adding anything.",
  "For retrieval, store the chunk, its embedding, and a reference back to the source document with enough detail to cite it. Getting a relevant chunk back is only half the job; being able to tell the user where it came from is what makes the answer checkable, and it is why provenance belongs in the schema rather than being reconstructed later.",
  "Version your embeddings, because you will change models. Store which model and which parameters produced each vector, so that when you upgrade you can re-embed incrementally and know exactly what is stale. Without this field, a model change means either re-embedding everything blindly or silently mixing incompatible vector spaces — and the second failure is invisible until retrieval quality quietly drops.",
  "Make ingestion idempotent. Pipelines get re-run: a job fails halfway, someone triggers it twice, a retry fires. If reprocessing the same document creates a second copy of every chunk, your retrieval degrades with each accident. Key on a stable identifier and upsert rather than insert.",
  "Keep operational logs append-first and separate, with a retention window decided in advance. Telemetry grows faster than everything else and it competes for exactly the resources your user-facing queries need. Deciding the retention policy before the table is large is considerably easier than deciding it afterwards.",
  "Write down what the schema means. A short document explaining each table, what owns what, and which queries the indexes exist for is the difference between a schema someone can extend and one they will work around. This is also a reliable interview topic, because a candidate who can explain why a schema looks the way it does is demonstrating the thinking rather than the result."
];

const databaseDesignContentFr = [
  "Un produit d'IA comporte trois charges de travail qui attendent des choses différentes d'une base : des données transactionnelles qui exigent de la cohérence, des données vectorielles qui exigent une recherche par similarité, et de la télémétrie écrite en permanence et lue rarement. Faire passer les trois par un seul magasin générique est la décision que les étudiants regrettent, car le réglage qui aide l'une pénalise activement l'autre.",
  "Modélisez les entités principales avant même de penser aux embeddings. Utilisateurs, projets, documents, traitements, évaluations : chacun avec une clé primaire, un champ de propriété explicite, et des horodatages de création et de mise à jour. La propriété, surtout, vous sauve plus tard : une ligne incapable de dire à qui elle appartient transforme chaque contrôle de permission en jointure non prévue.",
  "Indexez pour les requêtes que vous exécutez réellement, et vérifiez avec un plan d'exécution plutôt qu'à l'intuition. Les index ne sont pas gratuits : chacun coûte du débit en écriture et du stockage, et une table indexée sur chaque colonne est généralement le signe que personne n'a mesuré. Regardez ce que font vos requêtes lentes avant d'ajoter quoi que ce soit.",
  "Pour la recherche, stockez le fragment, son embedding, et une référence vers le document source assez précise pour le citer. Retrouver un fragment pertinent n'est que la moitié du travail ; pouvoir dire à l'utilisateur d'où il vient est ce qui rend la réponse vérifiable, et c'est pourquoi la provenance appartient au schéma plutôt qu'à une reconstruction ultérieure.",
  "Versionnez vos embeddings, car vous changerez de modèle. Stockez quel modèle et quels paramètres ont produit chaque vecteur, afin de pouvoir réencoder de façon incrémentale lors d'une montée de version et savoir exactement ce qui est périmé. Sans ce champ, changer de modèle signifie soit tout réencoder à l'aveugle, soit mélanger silencieusement des espaces vectoriels incompatibles — et cette seconde panne reste invisible jusqu'à ce que la qualité de recherche baisse discrètement.",
  "Rendez l'ingestion idempotente. Les pipelines sont relancés : un traitement échoue à mi-parcours, quelqu'un le déclenche deux fois, une nouvelle tentative part. Si retraiter le même document crée une seconde copie de chaque fragment, votre recherche se dégrade à chaque accident. Appuyez-vous sur un identifiant stable et faites une mise à jour plutôt qu'une insertion.",
  "Gardez les journaux d'exploitation en ajout seul et séparés, avec une durée de conservation décidée à l'avance. La télémétrie croît plus vite que tout le reste et concurrence exactement les ressources dont vos requêtes utilisateur ont besoin. Décider la politique de rétention avant que la table soit énorme est nettement plus facile qu'après.",
  "Écrivez ce que le schéma signifie. Un court document expliquant chaque table, ce qui appartient à quoi, et pour quelles requêtes les index existent, fait la différence entre un schéma que l'on peut étendre et un schéma que l'on contourne. C'est aussi un sujet d'entretien fiable : un candidat capable d'expliquer pourquoi un schéma a cette forme démontre le raisonnement plutôt que le résultat."
];

const cicdContent = [
  "A release pipeline for a student project should optimise for three things: it catches real mistakes, it runs fast enough that you do not route around it, and it is simple enough that you can still fix it in six months. Most pipelines that fail do so on the second and third, not the first — an elaborate pipeline that takes twenty minutes gets bypassed, and a bypassed gate is no gate.",
  "Start with four mandatory checks: lint, type check, tests, build. That sequence catches most of what actually breaks, in increasing order of cost, so the cheap checks fail first and you get feedback in seconds rather than minutes. Adding anything else before these four are reliable is premature.",
  "Turn on branch protection, because a pipeline nobody has to pass is decoration. Requiring checks to be green before merge is what converts the pipeline from advice into a constraint, and it is the single setting that most distinguishes a repository that stays working from one that slowly rots.",
  "Keep staging close to production, or do not have one. A staging environment that differs in runtime version, environment variables, or data shape produces confidence that does not transfer — bugs appear in production anyway, and you have paid for a second environment to learn nothing. Same container, same configuration mechanism, different values.",
  "Run a smoke test after deploy rather than assuming a successful deploy means a working service. Hit the health endpoint and one real route, and check the response is what you expect. Deployments that succeed and produce a broken site are common; the platform only knows whether the process started.",
  "Have a rollback path you have actually tested. Knowing the command in principle is not the same as having run it once, and the moment you need it is not the moment to discover that your last-known-good image was pruned. Practise it on a quiet afternoon so that using it under pressure is boring.",
  "Treat database migrations as the dangerous part of the pipeline, because they are the part that is hard to reverse. Prefer changes that are compatible with both the old and new code, deploy the migration before the code that needs it, and avoid destructive changes in the same release as the feature that stops using a column.",
  "Keep the whole thing fast. A pipeline under five minutes gets used on every commit; one over fifteen encourages batching changes, which makes each failure harder to attribute. Cache dependencies, run independent jobs in parallel, and be willing to move a slow check to a nightly run if it rarely catches anything.",
  "None of this is specific to machine learning, which is the point. A stable release process is read as evidence of judgement, and for backend and platform roles it is often weighted more heavily than the feature it shipped."
];

const cicdContentFr = [
  "Un pipeline de livraison pour un projet étudiant doit optimiser trois choses : il attrape de vraies erreurs, il tourne assez vite pour qu'on ne le contourne pas, et il reste assez simple pour être réparable dans six mois. La plupart des pipelines échouent sur les deux derniers points, pas sur le premier — un pipeline élaboré qui prend vingt minutes finit contourné, et une barrière contournée n'est plus une barrière.",
  "Commencez par quatre vérifications obligatoires : lint, vérification de types, tests, build. Cette séquence attrape l'essentiel de ce qui casse réellement, par coût croissant, de sorte que les contrôles peu chers échouent en premier et que le retour arrive en secondes plutôt qu'en minutes. Ajouter autre chose avant que ces quatre-là soient fiables est prématuré.",
  "Activez la protection de branche, car un pipeline que personne n'est obligé de passer n'est qu'une décoration. Exiger des contrôles au vert avant fusion transforme le pipeline d'un conseil en une contrainte, et c'est le réglage qui distingue le plus un dépôt qui reste fonctionnel d'un dépôt qui pourrit lentement.",
  "Gardez la préproduction proche de la production, ou n'en ayez pas. Un environnement qui diffère par la version du runtime, les variables d'environnement ou la forme des données produit une confiance non transférable : les bugs apparaissent quand même en production, et vous avez payé un second environnement pour ne rien apprendre. Même conteneur, même mécanisme de configuration, valeurs différentes.",
  "Lancez un test de fumée après déploiement plutôt que de supposer qu'un déploiement réussi signifie un service fonctionnel. Appelez l'endpoint de santé et une vraie route, et vérifiez que la réponse est bien celle attendue. Les déploiements qui réussissent en produisant un site cassé sont fréquents : la plateforme sait seulement que le processus a démarré.",
  "Ayez un chemin de retour arrière que vous avez réellement testé. Connaître la commande en théorie n'équivaut pas à l'avoir exécutée une fois, et le moment où vous en avez besoin n'est pas celui pour découvrir que votre dernière image saine a été supprimée. Entraînez-vous un après-midi calme, pour que l'utiliser sous pression soit ennuyeux.",
  "Traitez les migrations de base comme la partie dangereuse du pipeline, parce que c'est celle qu'on inverse mal. Préférez des changements compatibles avec l'ancien et le nouveau code, déployez la migration avant le code qui en dépend, et évitez les changements destructeurs dans la même version que la fonctionnalité qui cesse d'utiliser une colonne.",
  "Gardez l'ensemble rapide. Un pipeline sous cinq minutes est utilisé à chaque commit ; au-delà de quinze, il encourage à regrouper les changements, ce qui rend chaque échec plus difficile à attribuer. Mettez les dépendances en cache, parallélisez les travaux indépendants, et acceptez de déplacer vers une exécution nocturne un contrôle lent qui n'attrape presque rien.",
  "Rien de tout cela n'est spécifique au machine learning, et c'est justement le point. Un processus de livraison stable se lit comme une preuve de jugement, et pour des postes backend ou plateforme il pèse souvent plus lourd que la fonctionnalité livrée."
];

const observabilityContent = [
  "Observability exists to answer three questions quickly: what is broken, where is it broken, and why now. Without it, debugging is guesswork dressed up as investigation — you change something, redeploy, and see whether the complaints stop. That loop is slow enough that most student projects never get diagnosed at all; they just get abandoned.",
  "The three signals do different jobs and none substitutes for the others. Logs give you context about a single event. Metrics show you trends and let you say whether this is unusual. Traces show the path of one request across components and where the time went. A service with only logs can tell you an error happened but not whether it is happening more often than yesterday.",
  "At minimum, track latency percentiles, error rate, throughput, queue depth, and dependency failures. Use percentiles rather than averages, because an average hides exactly the problem you care about — if the median is fast and the ninety-ninth percentile is terrible, some users are having an awful time and the mean will never tell you.",
  "Put a correlation ID on every request at the edge and pass it through everything downstream. This is a small amount of work that changes debugging completely: instead of guessing which backend log line corresponds to the frontend error a user reported, you search one identifier and get the whole story. Without it you are correlating by timestamp, which fails the moment you have any concurrency.",
  "Log in a structured format rather than in prose. A line that is parseable lets you filter and count; a sentence does not. Include the fields you will want to group by — route, status, duration, model version, user or session where appropriate — and keep the shape consistent, because the value of structure comes from being able to rely on it.",
  "Be deliberate about what never goes in a log. Credentials, tokens, full prompts containing personal data, and raw request bodies are all easy to log accidentally and difficult to remove afterwards, since logs get shipped and retained. Decide what is safe once, at the logging helper, rather than at every call site.",
  "Alert only on conditions where a human should actually do something. An alert that fires and is routinely ignored is worse than no alert, because it trains you to ignore the next one — which will be the real incident. This is the same failure as a notification stream nobody reads: the mechanism exists, but it has stopped carrying information.",
  "Keep a dashboard with the handful of signals that matter, and look at it when nothing is wrong. Knowing what normal looks like is what makes abnormal obvious, and it is the difference between noticing a slow degradation and discovering it from a user.",
  "For a portfolio project, this is disproportionately visible. A student demo with correlation IDs, percentile latency, and a dashboard reads as production engineering, because that is what it is — and almost no competing project will have it."
];

const observabilityContentFr = [
  "L'observabilité existe pour répondre vite à trois questions : qu'est-ce qui est cassé, où, et pourquoi maintenant. Sans elle, le débogage n'est qu'une supposition déguisée en enquête : on change quelque chose, on redéploie, et on regarde si les plaintes cessent. Cette boucle est si lente que la plupart des projets étudiants ne sont jamais diagnostiqués — ils sont simplement abandonnés.",
  "Les trois signaux font des choses différentes et aucun ne remplace les autres. Les journaux donnent du contexte sur un événement précis. Les métriques montrent des tendances et permettent de dire si la situation est inhabituelle. Les traces montrent le trajet d'une requête entre composants et où le temps est passé. Un service qui n'a que des journaux sait qu'une erreur s'est produite, mais pas si elle survient plus souvent qu'hier.",
  "Au minimum, suivez les percentiles de latence, le taux d'erreur, le débit, la profondeur de file et les échecs de dépendances. Utilisez des percentiles plutôt que des moyennes : une moyenne masque exactement le problème qui vous intéresse. Si la médiane est rapide et le quatre-vingt-dix-neuvième percentile catastrophique, certains utilisateurs vivent un enfer que la moyenne ne révélera jamais.",
  "Posez un identifiant de corrélation sur chaque requête en entrée et propagez-le partout en aval. C'est peu de travail et cela change tout : au lieu de deviner quelle ligne de journal correspond à l'erreur signalée côté interface, vous cherchez un identifiant et obtenez toute l'histoire. Sans lui, vous corrélez par horodatage, ce qui échoue dès qu'il y a de la concurrence.",
  "Journalisez dans un format structuré plutôt qu'en prose. Une ligne analysable permet de filtrer et de compter ; une phrase non. Incluez les champs sur lesquels vous voudrez regrouper — route, statut, durée, version du modèle, session le cas échéant — et gardez une forme constante, car toute la valeur de la structure vient du fait de pouvoir s'y fier.",
  "Soyez délibéré sur ce qui ne doit jamais entrer dans un journal. Identifiants, jetons, prompts complets contenant des données personnelles, corps de requête bruts : tout cela se journalise par accident et se retire difficilement ensuite, puisque les journaux sont expédiés et conservés. Décidez une fois pour toutes, dans la fonction de journalisation, plutôt qu'à chaque appel.",
  "N'alertez que sur des conditions où un humain doit réellement agir. Une alerte qui se déclenche et qu'on ignore par habitude est pire que pas d'alerte : elle vous entraîne à ignorer la suivante, qui sera le vrai incident. C'est le même échec qu'un flux de notifications que personne ne lit — le mécanisme existe, mais il ne transporte plus d'information.",
  "Gardez un tableau de bord avec la poignée de signaux qui comptent, et regardez-le quand tout va bien. Savoir à quoi ressemble la normale est ce qui rend l'anormal évident, et c'est la différence entre remarquer une dégradation lente et l'apprendre par un utilisateur.",
  "Pour un projet de portfolio, c'est étonnamment visible. Une démo étudiante avec identifiants de corrélation, latence en percentiles et tableau de bord se lit comme de l'ingénierie de production — parce que c'en est — et presque aucun projet concurrent n'en aura."
];

const networkingBasicsContent = [
  "When an AI service feels slow, the model is the first thing blamed and usually the wrong one. A request that takes two seconds often spends a few hundred milliseconds in inference and the rest in DNS resolution, connection setup, TLS negotiation, payload serialisation, and waiting on a dependency that is itself waiting. Networking is where that time actually goes, and it is invisible until you measure it.",
  "The four things worth understanding properly are DNS, TCP, HTTP semantics, and TLS. DNS because a cold lookup adds latency and a stale cache causes failures that look random. TCP because connection setup costs a round trip you can avoid. HTTP because its semantics govern what is safe to retry. TLS because the handshake is expensive and reusing it is most of the win.",
  "Connection reuse is the cheapest improvement available to most services. Opening a new connection per request pays for the handshake every time; keeping connections alive amortises it across many. Most HTTP clients support this but not all enable it by default, and a client created inside a request handler starts from zero every single call — a mistake that is easy to make and invisible until you look at timings.",
  "Payload size matters more than people expect, because it interacts with everything else. Compression is usually worth it for text-heavy responses and usually not for small ones, where the compression cost exceeds the transfer saving. The more useful discipline is simply not returning fields nobody reads.",
  "Give every external call an explicit timeout budget, and make the budgets add up. A handler with a two-second target cannot make three sequential calls that each wait ten seconds. Without explicit deadlines the default is usually to wait far too long, which turns one slow dependency into a queue of stuck workers and then into an outage.",
  "Retries are where well-meaning code causes incidents. Retrying immediately turns a struggling service into an overwhelmed one; exponential backoff with jitter spreads the load instead of synchronising it. Retry only what is safe to retry — a read is naturally safe, a write is not unless you have made it idempotent with a key the server uses to recognise a duplicate.",
  "Instrument the timings you will need before you need them. Record DNS, connect, first byte, and total for outbound calls, and log the dependency name with each. The first time a dependency degrades, this turns a vague report of slowness into an obvious answer, and it costs almost nothing to add in advance.",
  "None of this is exotic knowledge, which is exactly why it separates engineers. Model quality is where the attention goes; network behaviour is where the reliability actually lives."
];

const networkingBasicsContentFr = [
  "Quand un service d'IA paraît lent, le modèle est la première chose accusée, et généralement la mauvaise. Une requête de deux secondes passe souvent quelques centaines de millisecondes en inférence et tout le reste en résolution DNS, établissement de connexion, négociation TLS, sérialisation, et attente d'une dépendance qui attend elle-même. C'est là que le temps part réellement, et c'est invisible tant qu'on ne le mesure pas.",
  "Les quatre notions à maîtriser sont le DNS, TCP, la sémantique HTTP et TLS. Le DNS parce qu'une résolution à froid ajoute de la latence et qu'un cache périmé provoque des pannes qui semblent aléatoires. TCP parce que l'établissement d'une connexion coûte un aller-retour évitable. HTTP parce que sa sémantique détermine ce qu'il est sûr de réessayer. TLS parce que la poignée de main coûte cher et que la réutiliser constitue l'essentiel du gain.",
  "La réutilisation des connexions est l'amélioration la moins chère disponible. Ouvrir une connexion par requête paie la poignée de main à chaque fois ; garder les connexions vivantes l'amortit sur plusieurs appels. La plupart des clients HTTP le permettent, tous ne l'activent pas par défaut, et un client créé à l'intérieur d'un gestionnaire de requête repart de zéro à chaque appel — une erreur facile à commettre et invisible sans mesure.",
  "La taille des charges utiles compte plus qu'on ne le croit, car elle interagit avec tout le reste. La compression vaut généralement le coup pour des réponses riches en texte, rarement pour les petites, où son coût dépasse le gain de transfert. La discipline la plus utile reste simplement de ne pas renvoyer des champs que personne ne lit.",
  "Donnez à chaque appel externe un budget de délai explicite, et faites en sorte que les budgets s'additionnent correctement. Un gestionnaire visant deux secondes ne peut pas enchaîner trois appels qui attendent chacun dix secondes. Sans échéance explicite, la valeur par défaut est presque toujours d'attendre beaucoup trop longtemps, ce qui transforme une dépendance lente en file de workers bloqués, puis en panne.",
  "C'est sur les tentatives que du code bien intentionné provoque des incidents. Réessayer immédiatement transforme un service en difficulté en service submergé ; un délai exponentiel avec variation aléatoire répartit la charge au lieu de la synchroniser. Ne réessayez que ce qui peut l'être : une lecture l'est naturellement, une écriture ne l'est que si vous l'avez rendue idempotente avec une clé que le serveur utilise pour reconnaître un doublon.",
  "Instrumentez les temps dont vous aurez besoin avant d'en avoir besoin. Enregistrez DNS, connexion, premier octet et durée totale pour les appels sortants, avec le nom de la dépendance. La première fois qu'une dépendance se dégrade, cela transforme un vague signalement de lenteur en réponse évidente, pour un coût quasi nul si c'est préparé.",
  "Rien de tout cela n'est ésotérique, et c'est précisément pourquoi cela distingue les ingénieurs. La qualité du modèle attire l'attention ; le comportement réseau est là où réside la fiabilité."
];

const operatingSystemsSkillsContent = [
  "A surprising number of production failures that get blamed on a framework are operating system problems wearing a disguise. Memory pressure, process limits, file descriptor exhaustion, and scheduling contention account for a large share of incidents in services that run models, and none of them are visible from inside the application code where people look first.",
  "Start with processes and signals, because that is where deployment failures concentrate. Understanding what happens when a container receives a termination signal explains why your service drops in-flight requests on every deploy, and why adding a graceful shutdown handler that stops accepting new work and finishes what it has fixes it. A worker that does not handle signals gets killed mid-request, every single release.",
  "Virtual memory is the concept that matters most for inference workloads, because model weights are large and memory behaviour is counterintuitive. The resident size of a process is not the same as what it allocated, shared pages between workers are counted in ways that mislead, and a process killed by the out-of-memory killer leaves almost nothing in your application logs to explain itself. Knowing where the kernel records that decision saves hours.",
  "File descriptors run out quietly and then all at once. Every socket, every open file, every connection to a database consumes one, and the default limit is lower than most people assume. A leak that takes days to manifest presents as a service that works fine and then refuses all connections, with an error that names the limit rather than the cause.",
  "Learn to inspect the machine before blaming the framework. Look at CPU, memory, disk, and open sockets first — whether your process is actually saturating a core, whether it is swapping, whether connections are piling up in a waiting state. This takes two minutes and frequently ends the investigation, because the answer is usually visible from outside the process.",
  "Service management is the difference between a service that recovers and one that stays down. Whether you use systemd or a container platform, what matters is the same: restart policy, startup ordering, health checks, and resource limits declared explicitly. A container with no memory limit will happily consume the host; one with a limit fails predictably, which is far easier to operate.",
  "Set resource limits even when you think you do not need them. Unbounded is not a safe default, it is an unexamined one — it means the first workload to misbehave takes down everything sharing the machine, rather than just itself.",
  "The reason this literacy pays is that it changes the category of the problem. Without it, an outage is an unexplained event you wait out. With it, it is a sequence of specific questions with specific answers, which is the entire difference between an engineer who is unblocked and one who is stuck."
];

const operatingSystemsSkillsContentFr = [
  "Un nombre surprenant de pannes en production imputées à un framework sont en réalité des problèmes de système d'exploitation déguisés. Pression mémoire, limites de processus, épuisement des descripteurs de fichiers, contention d'ordonnancement : ils représentent une large part des incidents sur les services qui exécutent des modèles, et aucun n'est visible depuis le code applicatif, là où l'on regarde d'abord.",
  "Commencez par les processus et les signaux, car c'est là que se concentrent les pannes de déploiement. Comprendre ce qui se passe quand un conteneur reçoit un signal d'arrêt explique pourquoi votre service perd les requêtes en cours à chaque déploiement, et pourquoi un arrêt gracieux — cesser d'accepter du travail, terminer ce qui est en cours — le corrige. Un worker qui n'écoute pas les signaux est tué en pleine requête, à chaque mise en production.",
  "La mémoire virtuelle est la notion la plus importante pour l'inférence, car les poids d'un modèle sont volumineux et le comportement mémoire est contre-intuitif. La taille résidente d'un processus n'est pas ce qu'il a alloué, les pages partagées entre workers sont comptées de façon trompeuse, et un processus tué par le mécanisme de manque de mémoire ne laisse presque rien dans vos journaux applicatifs. Savoir où le noyau consigne cette décision fait gagner des heures.",
  "Les descripteurs de fichiers s'épuisent silencieusement, puis d'un coup. Chaque socket, chaque fichier ouvert, chaque connexion à une base en consomme un, et la limite par défaut est plus basse qu'on ne le croit. Une fuite qui met des jours à se manifester se présente comme un service qui fonctionne bien puis refuse toute connexion, avec une erreur qui nomme la limite plutôt que la cause.",
  "Apprenez à inspecter la machine avant d'accuser le framework. Regardez d'abord le CPU, la mémoire, le disque et les sockets ouverts : votre processus sature-t-il réellement un cœur, y a-t-il du swap, les connexions s'accumulent-elles en attente. Cela prend deux minutes et clôt souvent l'enquête, parce que la réponse est généralement visible de l'extérieur du processus.",
  "La gestion de service fait la différence entre un service qui se rétablit et un service qui reste à terre. Que vous utilisiez systemd ou une plateforme de conteneurs, l'essentiel est identique : politique de redémarrage, ordre de démarrage, vérifications de santé et limites de ressources déclarées explicitement. Un conteneur sans limite mémoire consommera volontiers tout l'hôte ; un conteneur avec limite échoue de façon prévisible, ce qui est bien plus facile à exploiter.",
  "Fixez des limites de ressources même quand vous croyez ne pas en avoir besoin. L'absence de limite n'est pas un défaut sûr, c'est un défaut non examiné : elle signifie que la première charge qui dérape emporte tout ce qui partage la machine, et pas seulement elle-même.",
  "Si cette culture paie, c'est qu'elle change la nature du problème. Sans elle, une panne est un événement inexpliqué que l'on subit. Avec elle, c'est une suite de questions précises ayant des réponses précises — toute la différence entre un ingénieur débloqué et un ingénieur bloqué."
];

const mlTestingPlaybookContent = [
  "Machine learning quality depends on testing strategy far more than on model score, because a score is a single number measured once on data you chose. Tests are what tell you whether the system still behaves tomorrow, on data you did not choose, after someone changes a preprocessing step they believed was unrelated.",
  "There are four layers worth testing separately, and conflating them is why ML bugs are hard to find: the data, the feature transformations, the model behaviour, and the serving endpoint. A failure in each looks identical from the outside — bad predictions — so tests that cannot distinguish them leave you guessing.",
  "Validate data before training runs rather than after they produce something strange. Check schema, null rates, value ranges, and category cardinality, and fail loudly when they move outside expected bounds. A training job that silently consumes a column which became null last Tuesday will produce a model that is confidently wrong, and the score will not necessarily look alarming.",
  "Test feature transformations like ordinary code, because that is what they are. A normalisation step, a tokeniser, a date parser — each has edge cases, each can be unit tested with a handful of known inputs and expected outputs, and each is a common source of training-serving skew when the training path and the serving path drift apart.",
  "Evaluate with aggregate metrics and named edge cases together. The aggregate tells you whether the system is broadly working; a fixed set of cases you care about tells you whether it still handles the situations that matter. Keep those cases in version control with the expected behaviour written down, so a regression is visible as a failing test rather than as a vague sense that quality slipped.",
  "Track regressions across versions using a frozen dataset. The point is comparability: if the evaluation set changes at the same time as the model, you cannot attribute a difference to either. Freeze it, version it, and change it deliberately rather than incidentally.",
  "Test the serving endpoint as its own layer. Shape of the response, behaviour on malformed input, latency under a realistic payload, and what happens when the model file is missing. Plenty of systems have a correct model behind an endpoint that returns a five-hundred on any input containing a newline.",
  "Pair offline evaluation with an online signal, because offline agreement is not the same as being right. Even a crude production measurement — how often users retry, how often a result is abandoned — catches quality drops that your evaluation set was never designed to see.",
  "Write the playbook down. Which layers are tested, what runs on every commit, what runs nightly, and what a failure in each means. The document is what makes the practice survivable by someone who is not you, which is also precisely what an interviewer is trying to determine."
];

const mlTestingPlaybookContentFr = [
  "La qualité en machine learning dépend bien plus de la stratégie de test que du score du modèle, car un score est un chiffre unique mesuré une fois sur des données que vous avez choisies. Les tests, eux, disent si le système se comporte encore demain, sur des données non choisies, après que quelqu'un a modifié une étape de préparation qu'il croyait sans rapport.",
  "Quatre couches méritent d'être testées séparément, et les confondre explique pourquoi les bugs en ML sont difficiles à trouver : les données, les transformations de variables, le comportement du modèle, et l'endpoint de service. Vu de l'extérieur, une panne dans chacune se ressemble — de mauvaises prédictions — donc des tests incapables de les distinguer vous laissent deviner.",
  "Validez les données avant l'entraînement plutôt qu'après avoir obtenu un résultat étrange. Vérifiez le schéma, les taux de valeurs nulles, les plages de valeurs et le nombre de catégories, et échouez bruyamment quand ils sortent des bornes attendues. Un entraînement qui consomme silencieusement une colonne devenue nulle mardi dernier produira un modèle confiant et faux, sans que le score paraisse forcément alarmant.",
  "Testez les transformations de variables comme du code ordinaire, parce que c'en est. Une normalisation, un tokeniseur, un analyseur de dates : chacun a des cas limites, chacun se teste unitairement avec quelques entrées connues et des sorties attendues, et chacun est une source classique d'écart entre entraînement et service quand les deux chemins divergent.",
  "Évaluez avec des métriques agrégées et des cas nommés à la fois. L'agrégat dit si le système fonctionne globalement ; un ensemble fixe de cas qui vous tiennent à cœur dit s'il gère encore les situations qui comptent. Gardez ces cas sous gestion de version avec le comportement attendu écrit, pour qu'une régression apparaisse comme un test qui échoue plutôt que comme une vague impression de baisse.",
  "Suivez les régressions entre versions avec un jeu de données figé. L'enjeu est la comparabilité : si le jeu d'évaluation change en même temps que le modèle, vous ne pouvez attribuer l'écart ni à l'un ni à l'autre. Figez-le, versionnez-le, et modifiez-le délibérément plutôt qu'accidentellement.",
  "Testez l'endpoint de service comme une couche à part entière. Forme de la réponse, comportement sur entrée malformée, latence sur une charge réaliste, et ce qui se passe quand le fichier de modèle est absent. Beaucoup de systèmes ont un modèle correct derrière un endpoint qui renvoie une erreur cinq cents dès qu'une entrée contient un retour à la ligne.",
  "Associez évaluation hors ligne et signal en ligne, car un accord hors ligne n'équivaut pas à avoir raison. Même une mesure de production grossière — fréquence des nouvelles tentatives, fréquence des résultats abandonnés — attrape des baisses de qualité que votre jeu d'évaluation n'a jamais été conçu pour voir.",
  "Écrivez le manuel. Quelles couches sont testées, ce qui tourne à chaque commit, ce qui tourne la nuit, et ce que signifie un échec dans chacune. C'est ce document qui rend la pratique tenable par quelqu'un d'autre que vous — ce que l'intervieweur cherche précisément à déterminer."
];

const llmGuardrailsContent = [
  "Guardrails in an LLM application are system architecture, not prompt decoration. An instruction in a system prompt is a request, and a sufficiently determined input will get around it. A check in code is a control. Treating the two as equivalent is the single most common design error in student LLM projects, and it is the one that produces incidents.",
  "There are four places where things go wrong, and each needs its own handling: the input you receive, the context you retrieve, the text the model generates, and the actions it is allowed to take. A system that only validates the input has left three doors open.",
  "Check inputs before they reach a prompt template. Enforce a maximum length, reject or strip control characters, and be suspicious of text that contains instruction-like phrasing when it arrives in a field meant to hold data. Length limits are not only a safety measure — an unbounded input is also an unbounded bill.",
  "Treat retrieved context as untrusted, because it usually is. If your system ingests web pages, user uploads, or anything else you did not write, that content can contain instructions aimed at the model rather than at the reader. Keep retrieved material clearly delimited from your own instructions, and never let it reach a code path that can act.",
  "Ground responses in retrieved sources whenever factual reliability matters, and make the citation part of the contract rather than a nicety. A system that returns an answer with the passage it came from can be audited by a user; one that returns a confident paragraph with no provenance cannot be checked at all, which is precisely the failure mode people mean when they complain about hallucination.",
  "Constrain actions rather than trusting intentions. If the model can call tools, the authorisation belongs in the tool implementation, not in the instruction telling it which tools to use. Ask what damage the worst possible call could do, and make that call impossible rather than discouraged.",
  "Evaluate with scenarios, not vibes. Build a small set of cases covering normal use, known edge cases, and deliberately adversarial prompts, with the expected behaviour written down. Twenty cases you actually run on every change are worth more than a comprehensive suite you assembled once and never repeated.",
  "Log policy decisions as carefully as you log errors. When a request is blocked, record what triggered it and what the system did instead. Without that record you cannot tell whether your guardrails are working, too strict, or quietly failing open — and all three feel the same from the outside.",
  "Decide what happens when a check fails, and make it a deliberate choice. Failing closed is usually right for anything with consequences; failing open is acceptable for non-critical enrichment. What is never acceptable is not having decided, which is how a disabled safety check survives a deploy unnoticed."
];

const llmGuardrailsContentFr = [
  "Les garde-fous d'une application LLM relèvent de l'architecture, pas de la décoration de prompt. Une instruction dans un prompt système est une demande, et une entrée suffisamment déterminée la contournera. Une vérification dans le code est un contrôle. Confondre les deux est l'erreur de conception la plus fréquente dans les projets étudiants, et c'est celle qui produit des incidents.",
  "Quatre endroits posent problème, et chacun demande son propre traitement : l'entrée que vous recevez, le contexte que vous récupérez, le texte que le modèle génère, et les actions qu'il a le droit d'entreprendre. Un système qui ne valide que l'entrée a laissé trois portes ouvertes.",
  "Contrôlez les entrées avant qu'elles n'atteignent un template de prompt. Imposez une longueur maximale, rejetez ou nettoyez les caractères de contrôle, et méfiez-vous d'un texte formulé comme une instruction lorsqu'il arrive dans un champ censé contenir des données. Les limites de longueur ne sont pas qu'une mesure de sécurité : une entrée sans borne est aussi une facture sans borne.",
  "Traitez le contexte récupéré comme non fiable, parce qu'il l'est généralement. Si votre système ingère des pages web, des fichiers déposés par des utilisateurs ou tout ce que vous n'avez pas écrit, ce contenu peut contenir des instructions destinées au modèle plutôt qu'au lecteur. Délimitez clairement la matière récupérée de vos propres instructions, et ne la laissez jamais atteindre un chemin de code capable d'agir.",
  "Ancrez les réponses dans des sources récupérées dès que la fiabilité factuelle compte, et faites de la citation une partie du contrat plutôt qu'une politesse. Un système qui renvoie une réponse avec le passage dont elle provient peut être audité par l'utilisateur ; un système qui renvoie un paragraphe confiant sans provenance ne peut pas être vérifié du tout — exactement le défaut que les gens désignent quand ils parlent d'hallucination.",
  "Contraignez les actions plutôt que de faire confiance aux intentions. Si le modèle peut appeler des outils, l'autorisation appartient à l'implémentation de l'outil, pas à l'instruction qui lui dit lesquels utiliser. Demandez-vous quels dégâts causerait le pire appel possible, et rendez cet appel impossible plutôt que déconseillé.",
  "Évaluez avec des scénarios, pas à l'intuition. Constituez un petit ensemble de cas couvrant l'usage normal, les cas limites connus et des prompts délibérément hostiles, avec le comportement attendu écrit. Vingt cas que vous exécutez réellement à chaque changement valent mieux qu'une suite exhaustive assemblée une fois et jamais rejouée.",
  "Journalisez les décisions de politique aussi soigneusement que les erreurs. Quand une requête est bloquée, notez ce qui l'a déclenchée et ce que le système a fait à la place. Sans cette trace, impossible de savoir si vos garde-fous fonctionnent, sont trop stricts, ou échouent silencieusement en laissant passer — et ces trois cas se ressemblent vus de l'extérieur.",
  "Décidez de ce qui se passe quand un contrôle échoue, et faites-en un choix délibéré. Échouer en bloquant est généralement correct dès qu'il y a des conséquences ; échouer en laissant passer est acceptable pour un enrichissement non critique. Ce qui n'est jamais acceptable, c'est de ne pas avoir décidé — c'est ainsi qu'un contrôle de sécurité désactivé survit à un déploiement sans que personne ne le remarque."
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
        label: { en: "OWASP ASVS", fr: "OWASP ASVS" },
        href: "https://owasp.org/ASVS/"
      },
      {
        source: "OWASP",
        label: { en: "OWASP API Security", fr: "OWASP API Security" },
        href: "https://owasp.org/API-Security/"
      },
      {
        source: "NIST",
        label: { en: "NIST Cybersecurity Framework", fr: "NIST Cybersecurity Framework" },
        href: "https://www.nist.gov/cyberframework"
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
        label: { en: "PostgreSQL documentation", fr: "Documentation PostgreSQL" },
        href: "https://www.postgresql.org/docs/current/"
      },
      {
        source: "Redis",
        label: { en: "Redis documentation", fr: "Documentation Redis" },
        href: "https://redis.io/docs/latest/"
      },
      {
        source: "Pinecone",
        label: { en: "Pinecone learning center", fr: "Pinecone learning center" },
        href: "https://www.pinecone.io/learn/"
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
        label: { en: "GitHub Actions docs", fr: "Documentation GitHub Actions" },
        href: "https://docs.github.com/en/actions"
      },
      {
        source: "Docker",
        label: { en: "Docker build docs", fr: "Documentation build Docker" },
        href: "https://docs.docker.com/build/"
      },
      {
        source: "Google",
        label: { en: "Continuous delivery for ML", fr: "Livraison continue pour le ML" },
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
    references: [
      {
        source: "OpenTelemetry",
        label: { en: "OpenTelemetry docs", fr: "Documentation OpenTelemetry" },
        href: "https://opentelemetry.io/docs/"
      },
      {
        source: "Prometheus",
        label: { en: "Prometheus docs", fr: "Documentation Prometheus" },
        href: "https://prometheus.io/docs/"
      },
      {
        source: "Grafana",
        label: { en: "Grafana docs", fr: "Documentation Grafana" },
        href: "https://grafana.com/docs/"
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
    references: [
      {
        source: "MDN",
        label: { en: "HTTP overview", fr: "Vue d'ensemble HTTP" },
        href: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview"
      },
      {
        source: "Cloudflare",
        label: { en: "What is DNS?", fr: "Qu'est-ce que le DNS ?" },
        href: "https://www.cloudflare.com/learning/dns/what-is-dns/"
      },
      {
        source: "RFC Editor",
        label: { en: "TCP (RFC 9293)", fr: "TCP (RFC 9293)" },
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
    references: [
      {
        source: "OSTEP",
        label: { en: "Operating Systems: Three Easy Pieces", fr: "Operating Systems: Three Easy Pieces" },
        href: "https://pages.cs.wisc.edu/~remzi/OSTEP/"
      },
      {
        source: "Linux Kernel",
        label: { en: "Linux kernel docs", fr: "Documentation Linux kernel" },
        href: "https://docs.kernel.org/"
      },
      {
        source: "systemd",
        label: { en: "systemd docs", fr: "Documentation systemd" },
        href: "https://www.freedesktop.org/software/systemd/man/latest/"
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
    references: [
      {
        source: "Google",
        label: { en: "Rules of Machine Learning", fr: "Rules of Machine Learning" },
        href: "https://developers.google.com/machine-learning/guides/rules-of-ml"
      },
      {
        source: "scikit-learn",
        label: { en: "Model evaluation", fr: "Évaluation de modèle" },
        href: "https://scikit-learn.org/stable/model_selection.html"
      },
      {
        source: "Great Expectations",
        label: { en: "Great Expectations docs", fr: "Documentation Great Expectations" },
        href: "https://docs.greatexpectations.io/"
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
    references: [
      {
        source: "NIST",
        label: { en: "AI Risk Management Framework", fr: "Cadre de gestion du risque IA" },
        href: "https://www.nist.gov/itl/ai-risk-management-framework"
      },
      {
        source: "OWASP",
        label: { en: "OWASP Top 10 for LLM Applications", fr: "OWASP Top 10 for LLM Applications" },
        href: "https://owasp.org/www-project-top-10-for-large-language-model-applications/"
      },
      {
        source: "Anthropic",
        label: { en: "Building effective agents", fr: "Construire des agents efficaces" },
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
