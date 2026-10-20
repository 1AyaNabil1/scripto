/** One-click stories for the "Try" chips above the story box. Original to Scripto. */
export interface TryStory {
  id: string;
  label: string;
  lang: string;
  story: string;
}

export const TRY_STORIES: readonly TryStory[] = [
  {
    id: 'lighthouse',
    label: 'Lighthouse',
    lang: 'en',
    story:
      'On the last night before the lighthouse is shut down for good, its old keeper finds a letter tucked behind the lens. It is addressed to him, in his own handwriting, dated forty years in the future. It asks him to keep the light burning until dawn, because a small boat will be lost in the fog.',
  },
  {
    id: 'kite',
    label: 'طائرة ورقية',
    lang: 'ar',
    story:
      'في حيٍّ مزدحم في القاهرة، يتشاجر ولدان على سطحين متجاورين على الطائرة الورقية الحمراء نفسها كلَّ عصر، حتى تهبّ عاصفة فتتشابك خيوطهما معًا. وعندما تعلق الطائرة على هوائيٍّ بعيد، يضطرّ الولدان إلى العمل معًا لإنزالها قبل الغروب.',
  },
  {
    id: 'robot',
    label: 'Museum robot',
    lang: 'en',
    story:
      'A cleaning robot in an empty museum starts rearranging the paintings at night. By morning the guards notice that every portrait is looking at the same small door at the end of the hall, a door none of them has ever seen open.',
  },
];
