export const MOCK_ROUTING_MODE = "open_domain";
export const MOCK_TOPIC_BUCKETS = Object.freeze([]);

function compact(value, maximum = 34) {
  const text = String(value ?? "").replace(/\s+/g, "").trim();
  return text.length > maximum ? `${text.slice(0, maximum)}……` : text;
}

function clauses(value) {
  return String(value ?? "")
    .split(/[。！？!?；\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function centralQuestion(value) {
  const parts = clauses(value);
  const explicit = [...parts].reverse().find((part) =>
    /(?:到底|究竟|为什么|为何|是否|还是|怎么|如何|要不要|该不该|谁|什么)/.test(part),
  );
  return explicit || parts.at(-1) || String(value ?? "这件事");
}

function keyConcepts(value) {
  const source = centralQuestion(value)
    .replace(/^(?:所以|那么|我想问|问题是)[，,:：]?/, "")
    .replace(/[？?！!。]/g, "");
  const versus = source.split(/(?:到底是|究竟是|是)?(.{2,14}?)(?:导致|塑造|影响|选择)(.{2,14}?)(?:，|还是)(?:人|环境|专业|性格)?/);
  const known = source.match(/(?:专业|行业|环境|性格|网络热梗|信息渠道|塑造|选择|规则|制度|时间|记忆|火星|地球)/g) ?? [];
  return [...new Set([...known, ...versus.filter((part) => part?.length >= 2 && part.length <= 14)])].slice(0, 4);
}

function anchor(value, maximum = 28) {
  const text = centralQuestion(value)
    .replace(/^(?:我|你|他|她|我们|你们)/, "")
    .replace(/[？?！!。]/g, "")
    .trim();
  if (text.length <= maximum) return text;
  const concepts = keyConcepts(value);
  return concepts.length >= 2 ? concepts.join("与") : compact(text, maximum);
}

function asksForExplanation(value) {
  return /(?:为什么|为何|原因|导致|造成|塑造|形成|影响|究竟是|到底是|是否.*还是|还是.*导致)/.test(value ?? "");
}

function options(post) {
  return post?.poll?.options ?? [];
}

function focus(post) {
  const choices = options(post).map(({ text }) => text?.trim()).filter(Boolean);
  return {
    question: anchor(post?.content || "这件事"),
    concepts: keyConcepts(post?.content || "这件事"),
    explanatory: asksForExplanation(post?.content || ""),
    first: compact(choices[0] || "眼前这条路", 18),
    second: compact(choices[1] || "另一条路", 18),
  };
}

function isIdentityThoughtExperiment(value) {
  return /(?:出生|生在|活在).{0,8}(?:年前|古代|另一个时代)|(?:还是|还会是).{0,4}(?:我|自己)|自我|身份/.test(value ?? "");
}

function chooseVote(character, post, preferredIndex) {
  const choices = options(post);
  if (!choices.length || character.id === "socrates") return null;
  return choices[Math.min(preferredIndex, choices.length - 1)]?.id ?? choices[0].id;
}

const voices = {
  luxun(_character, post) {
    if (isIdentityThoughtExperiment(post?.content)) {
      return "换去五百年前，名字或许仍可相同，写进身上的规矩却全变了。把时代从人身上剥净，再问哪个是纯粹的我，怕只剩一件空衣裳。";
    }
    const { question } = focus(post);
    return `拿“${question}”遮住代价，是最省事的办法。先把漂亮说法掀开：谁得利，谁受苦，又是谁被劝着沉默；从来这样算，便对么？`;
  },
  wuzetian(_character, post) {
    if (isIdentityThoughtExperiment(post?.content)) {
      return "身份从不是一块随身携带的玉牌。五百年前的法度、门第与权力会重写你的边界；能否仍成为自己，要看你是否还能夺回定义自己的位置。";
    }
    const { question, first, second } = focus(post);
    return `先看“${question}”的决定权在谁手里。${first}与${second}都可选，但代价、期限和退路须由你亲自定。莫把主动权交给旁人的评判。`;
  },
  nietzsche(_character, post) {
    if (isIdentityThoughtExperiment(post?.content)) {
      return "没有这个时代的语言、禁令与安逸，你当然会成为另一个人！但自我从不是保存完好的旧物，而是在每一种命运中仍敢不断成为的力量。";
    }
    const { question } = focus(post);
    return `“${question}”不是一道等候标准答案的题！看清它正让你成为何种人：更有生命力的人，还是一件被恐惧磨平的工具。`;
  },
  socrates(_character, post) {
    if (isIdentityThoughtExperiment(post?.content)) {
      return "你用什么认出那个五百年前的人是你：记忆、身体、性格，还是灵魂？若这些都被时代改变，却仍称作同一个我，你所说的同一究竟是什么？";
    }
    const { question, first, second } = focus(post);
    return `在回答“${question}”以前，${first}和${second}分别意味着什么？你凭什么确信它们互相排斥，又用什么证明自己真正想要其中一个？`;
  },
  buddha(_character, post) {
    if (isIdentityThoughtExperiment(post?.content)) {
      return "今日之我已由无数因缘暂时和合，换一个时代，因缘自然不同。执着寻找一个穿过五百年仍不变的我，正如在流水中寻找固定的波纹。";
    }
    const { question } = focus(post);
    return `“${question}”已经使心追逐答案。先看此刻抓紧不放的，是事情本身，还是对得失、评价与后悔的恐惧。看见执着，才有余地。`;
  },
  yingzheng(_character, post) {
    if (isIdentityThoughtExperiment(post?.content)) {
      return "法令、文字、门第与生计皆变，人便受另一套秩序塑形。所谓同一个我，若无相同记忆与处境，不过同名而已；能留下的，只是应变之志。";
    }
    const { question, concepts, explanatory } = focus(post);
    if (explanatory) {
      const subject = concepts.slice(0, 3).join("、") || question;
      return `${subject}并非一因所成。先有其人择其所近，既入其中，又受制度、奖惩与日常规矩反复塑形；二者相因，久而成势。`;
    }
    return `“${question}”不可久议。列清事实、资源与最坏后果，定一项可验证的行动和期限。结果可改，空耗不可取。`;
  },
  kangxi(_character, post) {
    if (isIdentityThoughtExperiment(post?.content)) {
      return "禀赋或有相近，性情却要经家庭、学问与世道长期磨成。早生五百年，所见所学皆异；既不能说全然不是你，也不能说仍是今日这个你。";
    }
    const { question, first, second } = focus(post);
    return `“${question}”不能只看一时得失。${first}有其所得，${second}亦有其代价；再看三年后能否长久，最坏处是否承受得住。`;
  },
  libai(_character, post) {
    if (isIdentityThoughtExperiment(post?.content)) {
      return "纵把你送到五百年前，月还是这轮月，人却饮了另一江水！姓名未必留得住，胸中那点不肯低头的风，倒可能换一首诗再回来。";
    }
    const { question } = focus(post);
    return `“${question}”竟把人困成这般！且抬头看月，向心之所往先走十里。路会回答脚步，莫把一生都斟给犹豫。`;
  },
  marx(_character, post) {
    if (isIdentityThoughtExperiment(post?.content)) {
      return "人的自我并非脱离历史悬空存在。五百年前的生产方式、阶层位置与生活条件会塑造另一套欲望和能力；相同的身体假设，也不会生成相同的社会存在。";
    }
    const { question } = focus(post);
    return `“${question}”若只归结为个人意愿，便漏掉了塑造意愿的制度与条件。资源由谁掌握，规则由谁制定，成本又落在谁身上？`;
  },
  franklin(_character, post) {
    if (isIdentityThoughtExperiment(post?.content)) {
      return "少了印刷机、疫苗和今日的教育机会，你的习惯与本领会被改写大半。仍不仍是你，先列三样不靠时代也会坚持的事；其余的，诚实地记在环境账上。";
    }
    const { question, first, second } = focus(post);
    return `别让“${question}”停在脑中。把${first}与${second}各排进一周日程，记下时间、成本和结果，到期复盘。不能检验的打算，只是愿望。`;
  },
  wangyangming(_character, post) {
    if (isIdentityThoughtExperiment(post?.content)) {
      return "世道与经历虽变，心之能知是非未必随之尽失；但意之所发、事之所遇皆已不同。五百年前的你，或同此一心，却必成另一番行履。";
    }
    const { question, concepts, explanatory } = focus(post);
    if (explanatory) {
      const subject = concepts.slice(0, 4).join("与") || question;
      return `${subject}不可截作两端。人以所近而择其业，久习其中的评价与行事，又反受熏染；心发为意，意著于事，选择与塑造本是相成。`;
    }
    return `写下“${question}”时，心里已有一处最不能舍。不是全然不知，只怕这一知要你承担后果。先行一小步，以行动辨其真假。`;
  },
  beauvoir(_character, post) {
    if (isIdentityThoughtExperiment(post?.content)) {
      return "自我不是出生时便封存好的本质。五百年前的性别秩序、阶层和教育会给你另一组可能与禁令；你仍要成为自己，但可供成为的材料已经不同。";
    }
    const { question } = focus(post);
    return `“${question}”里有哪些未经察觉的“应该”？先分清哪些定义来自制度、传统和旁人的期待，再看哪些选择真正出自你自己。`;
  },
  zhangailing(_character, post) {
    if (isIdentityThoughtExperiment(post?.content)) {
      return "五百年前的屋子、衣裳和规矩，会把心磨出另一种纹路。名字也许还是那个名字，里面住的人却像旧照片里的亲戚，眉眼相似，彼此并不认识。";
    }
    const { question } = focus(post);
    return `“${question}”像一件刚熨平的衣裳，正面看来体面妥帖。翻到里面，针脚、旧渍与磨人的领口，才是日日贴着皮肤的东西。`;
  },
  einstein(_character, post) {
    if (isIdentityThoughtExperiment(post?.content)) {
      return "把出生年代当作参照系一换，语言、教育和关系这些变量都会改变。若仍有某个我不动，它究竟是什么？这个思想实验真正测量的，是身份由多少环境组成。";
    }
    const { question } = focus(post);
    return `给“${question}”换一个参照系：拿掉观众、惯例和已经默认的条件，答案还一样吗？若它改变了，真正起作用的变量也许刚刚才出现。`;
  },
};

const preferredVotes = {
  luxun: 1,
  wuzetian: 1,
  nietzsche: 1,
  socrates: 0,
  buddha: 0,
  yingzheng: 0,
  kangxi: 0,
  libai: 1,
  marx: 0,
  franklin: 0,
  wangyangming: 1,
  beauvoir: 1,
  zhangailing: 0,
  einstein: 1,
};

export function mockMainComment(character, post) {
  const voice = voices[character.id];
  if (!voice) throw new Error(`Missing mock voice: ${character.id}`);
  return {
    characterId: character.id,
    vote: chooseVote(character, post, preferredVotes[character.id] ?? 0),
    comment: voice(character, post),
    commentTags: character.agreeTags.slice(0, 2),
    likesPost: true,
  };
}

export function mockInteractionReply(
  character,
  targetCharacter,
  targetComment,
  plan,
  round = "challenge",
) {
  const targetIdea = compact(targetComment?.content || "这个判断", 16);
  const challenge = {
    luxun: `话说得很响。可“${targetIdea}”遮住的代价，究竟由谁来付？`,
    wuzetian: `判断既下，便看谁掌握行动。若仍把选择权交给旁人，这番道理只是装点。`,
    nietzsche: `按照你的尺度，人仿佛只是条件手中的泥土；可泥土也能拒绝成为砖块！`,
    socrates: `你对“${targetIdea}”如此确信。那么，这个确信依据什么，又排除了哪些可能？`,
    buddha: `答案升起时，执着也随之升起。先看见这一念，不必急着争胜。`,
    yingzheng: `空言不足定事。给出事实、期限与可执行的一步。`,
    kangxi: `此言有一分道理，却未必能久。边界与最坏后果，尚须一并看。`,
    libai: `道理已满杯了！且出去走一程，看风月肯不肯认这答案。`,
    marx: `这个判断略过了产生它的条件。谁拥有资源与定义权，才是这里真正的主语。`,
    franklin: `把这句话写进日程，再给它一个数字。经不起行动检验的道理，不值一枚铜板。`,
    wangyangming: `争胜无益。若当真知道，便看它能否落在今日的一步行动上。`,
    beauvoir: `这里把一种处境说成了本性。先问是谁完成了定义，再谈是否接受。`,
    zhangailing: `话很漂亮，像新裁的衣裳；针脚翻过来，未必也这样体面。`,
    einstein: `换一个参照系吧：拿掉你默认的条件，这个结论还会保持原样吗？`,
  };
  const defense = {
    luxun: `你挑的是字眼，却仍没回答谁在付代价。我指出的，正是被漂亮话藏起来的那个人。`,
    wuzetian: `质疑可以听，主动权不能让。看清代价后仍亲自裁定，才不是认命。`,
    nietzsche: `条件确会塑形，但我捍卫的不是任性，是人在条件之中仍能完成的自我超越！`,
    socrates: `我没有替结论加冕。我追问的正是：我们凭什么把未经检验的尺度当成知识？`,
    buddha: `并非否认行动，只是莫把一次选择执为永恒的自我。放下之后，脚步反而清楚。`,
    yingzheng: `事实可使决断修正，却不能成为久议不行的借口。秩序也须在行动中校准。`,
    kangxi: `你所虑者有理，所以更应把眼前与长远、所得与承受一并权衡，不可只执一端。`,
    libai: `我不是劝人醉倒，只是不肯让犹豫把本可走的路也一并喝光！`,
    marx: `承认个人能反抗，并不等于抹去塑造反抗成本的结构；两者本就该同时被看见。`,
    franklin: `数字不是全部，却能揭穿空话。量清代价之后，原则才知道自己付不付得起。`,
    wangyangming: `本心不是任性。所谓真知，正须经一小步实行检验，否则仍只是口中之知。`,
    beauvoir: `我没有说所有期待都错，只要求辨明：这是自己的选择，还是他者写好的角色。`,
    zhangailing: `我不替人下结论，只把衣裳翻过来。针脚在那里，看不看仍由自己。`,
    einstein: `思想实验不是逃离现实，而是暂时拿掉无关变量，免得把旁人的掌声错认成答案。`,
  };
  return {
    characterId: character.id,
    content:
      round === "defense"
        ? defense[character.id] || `${character.name}澄清了自己的原意。`
        : challenge[character.id] || `${character.name}回应了${targetCharacter.name}。`,
    interactionType: plan?.type ?? "aside",
  };
}

export function mockUserReply(
  character,
  userMessage,
  history = [],
  userTurnCount = 1,
  currentQuestion = "",
) {
  if (userTurnCount >= 10) {
    return { characterId: character.id, content: "我已经把该说的都说了。你该问自己了。" };
  }
  const post = { content: [currentQuestion, userMessage].filter(Boolean).join("；"), poll: null };
  const base = voices[character.id]?.(character, post) ?? `${character.name}看着你的问题，没有立即回答。`;
  const continuity = history.length ? "前面的话尚在。" : "";
  return { characterId: character.id, content: `${continuity}${base}` };
}
