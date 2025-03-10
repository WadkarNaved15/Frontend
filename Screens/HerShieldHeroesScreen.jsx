const React = require('react');
const { View, Text, StyleSheet, Image, FlatList, Alert, Share,TouchableOpacity } = require('react-native');
const { useNavigation } = require('@react-navigation/native');
const Ionicons = require('react-native-vector-icons/Ionicons').default;
const Footer = require('../Components/Footer');

const data = [
    { id: '1', name: 'Salman Khan', rank: '#1', avatar: require('../assets/male.png') },
    { id: '2', name: 'Sonu Sood', rank: '#2', avatar: null },
    { id: '3', name: 'Radhika Samriddhi Iyer', rank: '#3', avatar: null },
    { id: '4', name: 'Anirudh Devendra', rank: '#4', avatar: null },
    { id: '5', name: 'Fatima Zainab Qureshi', rank: '#5', avatar: null },
    { id: '6', name: 'Mohammad Zahiruddin', rank: '#6', avatar: null },
  ];

function HerShieldHeroesScreen({navigation}) {

return(

        <View style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.headerText}>HerShield Heroes</Text>
        </View>
         <View style={styles.mainHeroContainer}>
                  <Image source={require('../assets/male.png')} style={styles.mainHeroAvatar} />
                  <Image source={require('../assets/golden-award-laurel-wreath-winner-leaf-label-symbol-of-victory-illustration-2DG8KKT-removebg-preview.png')} style={styles.goldenBorder} />
                  <Text style={styles.mainHeroRank}>#1</Text>
                  <Text style={styles.mainHeroName}>Salman Khan</Text>
                </View>
                
                <FlatList
    data={data}
    renderItem={({ item }) => <HeroCard name={item.name} rank={item.rank} avatar={item.avatar} />}
    keyExtractor={(item) => item.id.toString()}
    numColumns={2}
    contentContainerStyle={styles.heroList}
    showsVerticalScrollIndicator={false}
  />
        
    </View>
)

}

const HeroCard = ({ name, rank, avatar }) => {
    const rankStyles = {
      '#1': styles.goldRank,
      '#2': styles.silverRank,
      '#3': styles.bronzeRank,
    };
  
    return (
      <View style={styles.heroCard}>
        <View style={styles.avatarContainer}>
          {avatar ? (
            <Image
              source={typeof avatar === 'string' ? { uri: avatar } : avatar}
              style={styles.avatarImage}
            />
          ) : (
            <Ionicons name="person-circle-outline" size={60} color="gray" />
          )}
        </View>
        <Text style={styles.heroName}>{name}</Text>
        {rank && <Text style={rankStyles[rank] || styles.rank}>{rank}</Text>}
      </View>
    );
  };


const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f2f2f2',
      paddingHorizontal: 16,
      marginVertical: 30,
      marginBottom: 80,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
    },
    headerText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#1B3A4B',
    },
    mainHeroContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    mainHeroAvatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginBottom: 10,
      resizeMode: 'contain',
    },
    mainHeroRank: {
      fontSize: 30,
      fontWeight: 'bold',
      color: '#1B3A4B',
      marginTop: 20,
    },
    mainHeroName: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#1B3A4B',
    },
    goldenBorder: {
      position: 'absolute',
      top: -21,
      right: '19.5%',
      width: 200,
      height: 200,
    },
    heroList: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    heroCard: {
      backgroundColor: '#dedbcd',
      alignItems: 'center',
      padding: 16,
      borderRadius: 8,
      margin: 8,
      width: '45%',
    },
    avatarContainer: {
      marginBottom: 8,
    },
    avatarImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
    },
    heroName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#444',
      textAlign: 'center',
    },
    goldRank: {
      fontSize: 16,
      color: '#B8860B',
      marginTop: 5,
    },
    silverRank: {
      fontSize: 16,
      color: '#8A8A8A',
      marginTop: 5,
    },
    bronzeRank: {
      fontSize: 16,
      color: '#8C5430',
      marginTop: 5,
    },
    rank: {
      fontSize: 16,
      color: '#988D79',
      marginTop: 5,
    },
  });
module.exports = HerShieldHeroesScreen