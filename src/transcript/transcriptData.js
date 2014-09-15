function transcriptData(data) {
  function parseCancer(cdata) {
    var defaultInactivatingMutations = {
          "Nonsense_Mutation": true,
          "Frame_Shift_Del": true,
          "Frame_Shift_Ins":true,
          "Missense_Mutation": false,
          "Splice_Site": true,
          "In_Frame_Del": false,
          "In_Frame_Ins": false
        };
    var defaultMutationTypesToSymbols = {
          "Nonsense_Mutation": 0,
          "Frame_Shift_Del": 1,
          "Frame_Shift_Ins": 1,
          "Missense_Mutation": 2,
          "Splice_Site": 3,
          "In_Frame_Del": 4,
          "In_Frame_Ins": 4
        };

    var proteinDomainDB = cdata.proteinDomainDB || '';

    var d = {
      geneName: cdata.gene,
      inactivatingMutations: cdata.inactivatingMutations || defaultInactivatingMutations,
      length: cdata.length,
      mutationCategories: cdata.mutationCategories || [],
      mutations: cdata.mutations,
      mutationTypesToSymbols: cdata.mutationTypesToSymbols || defaultMutationTypesToSymbols,
      proteinDomainDB: proteinDomainDB,
      proteinDomains: cdata.domains[proteinDomainDB]
    };

    if (d.mutationCategories.length == 0){
      d.mutationCategories = gd3_util.arrayToSet(cdata.mutations.map(function(m) { return m.dataset; }));
    }

    for (var mutation in d.mutations) {
      var m = d.mutations[mutation];

      // create simulated annotation data if it does not exist.
      if (m.annotation == undefined) {
        var vote = {
          type: 'vote',
          score: 100
        }
        m.annotation = [
          {
            type: 'text',
            title: 'Sample',
            text: m.sample
          },
          {
            type: 'table',
            header: ['Cancer', 'PMIDs', 'Votes'],
            data: [
              ['1', '2', vote],
              ['4', '5', vote]
            ]
          }
        ];
        // m.annotation = [
        //   {
        //     type: 'text',
        //     title: 'Sample',
        //     text: m.sample
        //   },
        //   {
        //     type: 'text',
        //     title: 'Test',
        //     text: 'is working'
        //   },
        //   {
        //     type: 'table',
        //     header: ['Cancer', 'PMIDs', 'Votes'],
        //     data: [
        //       ['1', '2', '3'],
        //       ['4', '5', '6']
        //     ]
        //   }
        // ];
      } // end simulated m.annotation
      else {
        console.log('defined annotation');
      }
    }

    d.get = function(str) {
      if (str == 'length') return d.length;
      else if (str == 'mutationCategories') return d.mutationCategories;
      else if (str == 'mutations') return d.mutations;
      else if (str == 'mutationTypesToSymbols') return d.mutationTypesToSymbols;
      else if (str == 'proteinDomains') return d.proteinDomains;
      else return null;
    }
    d.isMutationInactivating = function(mut) {
      return d.inactivatingMutations[mut];
    }

    return d;
  }
  var tData = parseCancer(data);

  return tData;
}