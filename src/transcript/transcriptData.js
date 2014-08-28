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

    console.log(d.mutations);
    for (var mutation in d.mutations) {
      var m = d.mutations[mutation];
      m.annotation = [
        {
          type: 'text',
          title: 'Sample',
          value: m.sample
        },
        {
          type: 'text',
          title: 'Test',
          value: 'is working'
        }
      ];
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